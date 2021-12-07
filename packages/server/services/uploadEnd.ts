import fetch from 'node-fetch';
import {
  getSourceFileKey,
  getSourceFileOS,
} from '$shared-server/objectStorages.js';
import { is } from '$shared/is.js';
import { Region } from '$shared/regions.js';
import { TRANSCODER_API_ENDPOINT } from '$transcoder/devConfig.js';
import {
  TranscoderRequest,
  TranscoderRequestFile,
  TranscoderRequestOptions,
} from '$transcoder/types/transcoder.js';
import { Source, SourceFile } from '$prisma/client';
import { client } from '$/db/lib/client.js';
import { SourceState } from '$/db/lib/types.js';
import { HTTPError } from '$/utils/httpError.js';
import {
  TRANSCODER_CALLBACK_API_ENDPOINT,
  TRANSCODER_CALLBACK_API_TOKEN,
} from './transcoderCallback.js';
import { splitIntoParts } from './uploadConfig.js';
import { createUserUploadS3Cached } from './userOS.js';

function createTranscoderRequestFiles(
  source: Source & { files: SourceFile[] },
  options: TranscoderRequestOptions
): TranscoderRequestFile[] {
  return source.files
    .map((file): TranscoderRequestFile | null => {
      switch (file.type) {
        case 'audio':
          return {
            type: 'audio',
            sourceFileId: file.id,
            region: file.region as Region,
            filename: file.filename,
            fileSize: file.fileSize,
            sourceId: source.id,
            userId: file.userId,
            options,
            cueSheetSourceFileId: file.cueSheetFileId,
          };

        case 'image':
          if (!file.albumId) {
            throw new HTTPError(500, 'image file must have albumId');
          }
          return {
            type: 'image',
            sourceFileId: file.id,
            region: file.region as Region,
            filename: file.filename,
            fileSize: file.fileSize,
            sourceId: source.id,
            userId: file.userId,
            options,
            albumId: file.albumId,
            extracted: false,
          };
      }
      return null;
    })
    .filter((file): file is TranscoderRequestFile => !!file);
}

async function invokeTranscoder(request: TranscoderRequest): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await fetch(TRANSCODER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }).catch((error) => {
      console.error(error);
    });
  } else {
    // TODO(prod): call AWS Lambda
  }
}

async function invokeTranscoderBySource(
  userId: string,
  sourceId: string
): Promise<void> {
  const source = await client.source.findFirst({
    where: {
      id: sourceId,
      userId,
    },
    include: {
      files: true,
    },
  });

  if (!source) {
    throw new HTTPError(404, `source ${sourceId} not found`);
  }

  if ((source.state as SourceState) !== 'uploaded') {
    if (source.state === 'transcoding') {
      // processed by another process
      return;
    }
    throw new HTTPError(409, `state of source ${sourceId} is ${source.state}`);
  }

  const updated = await client.source.updateMany({
    where: {
      id: sourceId,
      userId,
      state: is<SourceState>('uploaded'),
    },
    data: {
      state: is<SourceState>('transcoding'),
      transcodeStartedAt: new Date(),
    },
  });
  if (!updated.count) {
    // processed by another process
    return;
  }

  const request: TranscoderRequest = {
    callbackURL: TRANSCODER_CALLBACK_API_ENDPOINT,
    callbackToken: TRANSCODER_CALLBACK_API_TOKEN,
    files: createTranscoderRequestFiles(source, {
      // TODO(prod): make this configurable
      defaultUnknownAlbumArtist: 'Unknown Artist',
      defaultUnknownAlbumTitle: 'Unknown Album',
      defaultUnknownTrackArtist: 'Unknown Artist',
      defaultUnknownTrackTitle: 'Unknown Track',
      useFilenameAsUnknownTrackTitle: true,
      useTrackArtistAsUnknownAlbumArtist: true,
      useTrackTitleAsUnknownAlbumTitle: true,
      downloadAudioToNFS: false,
      extractImages: true,
      preferExternalCueSheet: true,
    }),
  };

  await invokeTranscoder(request);
}

function invokeTranscodeBySourceSync(userId: string, sourceId: string): void {
  invokeTranscoderBySource(userId, sourceId).catch((error) => {
    console.error(error);
  });
}

/**
 * クライアントがファイルアップロードの完了を通知したときに呼ぶ関数 \
 * （DB操作とトランスコーダの起動を行う）
 * @param userId
 * @param sourceId
 * @param sourceFileId
 * @param etags
 * @returns
 */
export async function onSourceFileUploaded(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  etags?: string[]
): Promise<void> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    include: {
      source: {
        include: {
          files: true,
        },
      },
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `source file ${sourceFileId} not found`);
  }

  if (sourceFile.uploaded) {
    throw new HTTPError(409, `source file ${sourceFileId} already uploaded`);
  }

  if (sourceFile.source.state !== is<SourceState>('uploading')) {
    throw new HTTPError(500, `state of the source ${sourceId} is inconsistent`);
  }

  if (sourceFile.uploadId) {
    if (!etags) {
      throw new HTTPError(400, `etags must be specified for multipart upload`);
    }

    const partLength = splitIntoParts(sourceFile.fileSize).length;
    if (etags.length !== partLength) {
      throw new HTTPError(
        400,
        `etag count of the source file ${sourceFileId} is inconsistent`
      );
    }

    // complete multipart upload
    const os = getSourceFileOS(sourceFile.region as Region);
    const key = getSourceFileKey(userId, sourceFileId);
    const s3 = createUserUploadS3Cached(os);

    // TODO(prod): error handling
    await s3.completeMultipartUpload({
      Bucket: os.bucket,
      Key: key,
      UploadId: sourceFile.uploadId,
      MultipartUpload: {
        Parts: etags!.map((etag, index) => ({
          PartNumber: index + 1,
          ETag: etag,
        })),
      },
    });
  }

  const updated = await client.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
      uploaded: false,
    },
    data: {
      uploaded: true,
      uploadedAt: new Date(),
    },
  });
  if (!updated.count) {
    // updated by another process
    return;
  }

  // TODO(prod): lock object

  const allFilesUploaded = sourceFile.source.files.every(
    (file) => file.id === sourceFileId || file.uploaded
  );
  if (!allFilesUploaded) {
    // upload in progress
    return;
  }

  await client.source.updateMany({
    where: {
      id: sourceId,
      userId,
      // checking the state is required as it may be executed at the same time as the change from 'uploaded' to 'transcoding'
      state: is<SourceState>('uploading'),
    },
    data: {
      state: is<SourceState>('uploaded'),
    },
  });

  // start transcode
  invokeTranscodeBySourceSync(userId, sourceId);
}
