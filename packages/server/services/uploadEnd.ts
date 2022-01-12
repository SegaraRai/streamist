import fetch from 'node-fetch';
import { is } from '$shared/is';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
} from '$shared/objectStorage';
import { retryS3, retryS3NoReject } from '$shared/retry';
import { USE_NFS_SIZE_THRESHOLD } from '$shared/sourceFileConfig';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceState,
} from '$shared/types/db';
import { TRANSCODER_API_ENDPOINT } from '$transcoder/devConfig';
import {
  TranscoderRequest,
  TranscoderRequestFile,
  TranscoderRequestOptions,
} from '$transcoder/types/transcoder';
import { Source, SourceFile } from '$prisma/client';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { logger } from './logger';
import {
  TRANSCODER_CALLBACK_API_ENDPOINT,
  TRANSCODER_CALLBACK_API_TOKEN,
} from './transcoderCallback';
import { splitIntoParts } from './uploadConfig';
import { createUserUploadS3Cached } from './userOS';

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
            region: file.region as OSRegion,
            filename: file.filename,
            fileSize: file.fileSize,
            sourceId: source.id,
            userId: file.userId,
            options,
            cueSheetSourceFileId: file.cueSheetFileId,
          };

        case 'image':
          if (!file.attachToType || !file.attachToId) {
            throw new HTTPError(
              500,
              'image file must have attachToType and attachToId'
            );
          }
          return {
            type: 'image',
            sourceFileId: file.id,
            region: file.region as OSRegion,
            filename: file.filename,
            fileSize: file.fileSize,
            sourceId: source.id,
            userId: file.userId,
            options,
            attachToType: file.attachToType as SourceFileAttachToType,
            attachToId: file.attachToId,
            attachPrepend: !!file.attachPrepend,
            extracted: false,
          };
      }
      return null;
    })
    .filter((file): file is TranscoderRequestFile => !!file);
}

async function invokeTranscoder(request: TranscoderRequest): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch(TRANSCODER_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        logger.error('failed to invoke transcoder (%d)', response.status);
      }
    } catch (error: unknown) {
      logger.error(error, 'failed to invoke transcoder');
    }
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

  const timestamp = Date.now();

  const updated = await client.source.updateMany({
    where: {
      id: sourceId,
      userId,
      state: is<SourceState>('uploaded'),
    },
    data: {
      state: is<SourceState>('transcoding'),
      transcodeStartedAt: timestamp,
      updatedAt: timestamp,
    },
  });
  if (!updated.count) {
    // processed by another process
    return;
  }

  await client.sourceFile.updateMany({
    where: {
      userId,
      sourceId,
      state: is<SourceFileState>('uploaded'),
    },
    data: {
      state: is<SourceFileState>('transcoding'),
      updatedAt: timestamp,
    },
  });

  await dbResourceUpdateTimestamp(userId);

  const sourceFiles = await client.sourceFile.findMany({
    where: {
      userId,
      sourceId,
    },
    select: {
      fileSize: true,
    },
  });

  const maxSourceFileSize = Math.max(
    ...sourceFiles.map((sourceFile) => sourceFile.fileSize)
  );

  const downloadAudioToNFS = maxSourceFileSize >= USE_NFS_SIZE_THRESHOLD;

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
      downloadAudioToNFS,
      extractImages: true,
      preferExternalCueSheet: true,
    }),
  };

  await invokeTranscoder(request);
}

function invokeTranscodeBySourceSync(userId: string, sourceId: string): void {
  invokeTranscoderBySource(userId, sourceId).catch((error) => {
    logger.error(error, 'invokeTranscoderBySource failed');
  });
}

async function onSourceFileUpdated(
  userId: string,
  sourceId: string,
  timestamp: number
): Promise<void> {
  // NOTE: `uploaded`を更新した後に改めて取得しないと検出漏れする場合がある
  const sourceFiles = await client.sourceFile.findMany({
    where: {
      sourceId,
      userId,
    },
  });

  const someFilesAborted = sourceFiles.some(
    (file) => file.state === is<SourceFileState>('aborted')
  );
  const allFilesUploaded =
    !someFilesAborted &&
    sourceFiles.every((file) => file.state === is<SourceFileState>('uploaded'));
  if (!someFilesAborted && !allFilesUploaded) {
    // upload in progress
    await dbResourceUpdateTimestamp(userId);
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
      state: is<SourceState>(allFilesUploaded ? 'uploaded' : 'aborted'),
      updatedAt: timestamp,
    },
  });

  if (allFilesUploaded) {
    // start transcode
    await dbResourceUpdateTimestamp(userId);

    invokeTranscodeBySourceSync(userId, sourceId);
  } else {
    // delete uploaded files
    await client.sourceFile.updateMany({
      where: {
        userId,
        sourceId,
        entityExists: true,
        state: is<SourceFileState>('uploaded'),
      },
      data: {
        entityExists: false,
        updatedAt: timestamp,
      },
    });

    const uploadedSourceFiles = await client.sourceFile.findMany({
      where: {
        userId,
        sourceId,
        state: is<SourceFileState>('uploaded'),
      },
      select: {
        id: true,
        region: true,
      },
    });

    for (const sourceFile of uploadedSourceFiles) {
      const os = getSourceFileOS(sourceFile.region as OSRegion);
      const key = getSourceFileKey(userId, sourceFile.id);
      const s3 = createUserUploadS3Cached(os);

      await retryS3NoReject(() =>
        s3.deleteObject({
          Bucket: os.bucket,
          Key: key,
        })
      );
    }

    await dbResourceUpdateTimestamp(userId);
  }
}

/**
 * クライアントがファイルアップロードの中止を通知したときに呼ぶ関数 \
 * （DB操作とトランスコーダの起動を行う）
 * @param userId
 * @param sourceId
 * @param sourceFileId
 * @returns
 */
export async function onSourceFileAborted(
  userId: string,
  sourceId: string,
  sourceFileId: string
): Promise<void> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    include: {
      source: true,
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `source file ${sourceFileId} not found`);
  }

  if (sourceFile.state !== is<SourceFileState>('uploading')) {
    throw new HTTPError(
      409,
      `source file ${sourceFileId} already aborted or uploaded`
    );
  }

  if (sourceFile.source.state !== is<SourceState>('uploading')) {
    throw new HTTPError(500, `state of the source ${sourceId} is inconsistent`);
  }

  const timestamp = Date.now();

  const updated = await client.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
      state: is<SourceFileState>('uploading'),
    },
    data: {
      state: is<SourceFileState>('aborted'),
      entityExists: false,
      uploadedAt: timestamp,
      updatedAt: timestamp,
    },
  });
  if (!updated.count) {
    // updated by another process
    return;
  }

  const os = getSourceFileOS(sourceFile.region as OSRegion);
  const key = getSourceFileKey(userId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  const { uploadId } = sourceFile;

  if (uploadId) {
    // abort multipart upload
    await retryS3NoReject(() =>
      s3.abortMultipartUpload({
        Bucket: os.bucket,
        Key: key,
        UploadId: uploadId,
      })
    );
  } else {
    await retryS3NoReject(() =>
      s3.deleteObject({
        Bucket: os.bucket,
        Key: key,
      })
    );
  }

  await onSourceFileUpdated(userId, sourceId, timestamp);
}

/**
 * クライアントがファイルアップロードの完了を通知したときに呼ぶ関数 \
 * （DB操作とトランスコーダの起動を行う）
 * @param userId
 * @param sourceId
 * @param sourceFileId
 * @param eTags
 * @returns
 */
export async function onSourceFileUploaded(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  eTags?: string[]
): Promise<void> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    include: {
      source: true,
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `source file ${sourceFileId} not found`);
  }

  if (sourceFile.state !== is<SourceFileState>('uploading')) {
    throw new HTTPError(
      409,
      `source file ${sourceFileId} already aborted or uploaded`
    );
  }

  if (sourceFile.source.state !== is<SourceState>('uploading')) {
    throw new HTTPError(500, `state of the source ${sourceId} is inconsistent`);
  }

  const { uploadId } = sourceFile;

  if (uploadId) {
    if (!eTags) {
      throw new HTTPError(400, `ETags must be specified for multipart upload`);
    }

    const partLength = splitIntoParts(sourceFile.fileSize).length;
    if (eTags.length !== partLength) {
      throw new HTTPError(
        400,
        `ETag count of the source file ${sourceFileId} is inconsistent`
      );
    }

    // complete multipart upload
    const os = getSourceFileOS(sourceFile.region as OSRegion);
    const key = getSourceFileKey(userId, sourceFileId);
    const s3 = createUserUploadS3Cached(os);

    // TODO(prod): error handling
    await retryS3(() =>
      s3.completeMultipartUpload({
        Bucket: os.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: eTags!.map((eTag, index) => ({
            PartNumber: index + 1,
            ETag: eTag,
          })),
        },
      })
    );
  }

  const timestamp = Date.now();

  const updated = await client.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
      state: is<SourceFileState>('uploading'),
    },
    data: {
      state: is<SourceFileState>('uploaded'),
      entityExists: true,
      uploadedAt: timestamp,
      updatedAt: timestamp,
    },
  });
  if (!updated.count) {
    // updated by another process
    return;
  }

  await onSourceFileUpdated(userId, sourceId, timestamp);
}
