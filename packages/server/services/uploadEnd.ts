import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
} from '$shared-server/objectStorage';
import { USE_GCR_SIZE_THRESHOLD } from '$shared/config';
import { filterNullAndUndefined } from '$shared/filter';
import { is } from '$shared/is';
import { retryS3, retryS3NoReject } from '$shared/retry';
import type {
  SourceFileAttachToType,
  SourceFileState,
  SourceState,
} from '$shared/types';
import {
  TranscoderRequest,
  TranscoderRequestFile,
  TranscoderRequestOptions,
} from '$transcoder/types';
import type { SourceFile } from '$prisma/client';
import { TRANSCODER_CALLBACK_API_PATH } from '$/config';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { DBTimestamp, dbGetTimestamp } from '$/db/lib/timestamp';
import { osDeleteSourceFiles } from '$/os/sourceFile';
import { logger } from '$/services/logger';
import { invokeTranscoder } from '$/services/transcoder';
import { splitIntoParts } from '$/services/uploadUtils';
import { createUserUploadS3Cached } from '$/services/userOS';
import { HTTPError } from '$/utils/httpError';

function createTranscoderRequestFiles(
  sourceFiles: readonly Pick<
    SourceFile,
    | 'id'
    | 'region'
    | 'type'
    | 'filename'
    | 'fileSize'
    | 'cueSheetFileId'
    | 'attachToId'
    | 'attachToType'
    | 'attachPrepend'
    | 'sourceId'
    | 'userId'
  >[],
  options: TranscoderRequestOptions
): TranscoderRequestFile[] {
  return filterNullAndUndefined(
    sourceFiles.map((file): TranscoderRequestFile | null => {
      switch (file.type) {
        case 'audio':
          return {
            type: 'audio',
            sourceFileId: file.id,
            region: file.region as OSRegion,
            filename: file.filename,
            fileSize: file.fileSize,
            sourceId: file.sourceId,
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
            sourceId: file.sourceId,
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
  );
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
    select: {
      state: true,
      files: {
        select: {
          id: true,
          region: true,
          type: true,
          filename: true,
          fileSize: true,
          cueSheetFileId: true,
          attachToId: true,
          attachToType: true,
          attachPrepend: true,
          sourceId: true,
          userId: true,
        },
      },
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

  if (source.files.length === 0) {
    throw new HTTPError(
      500,
      `source ${sourceId} has no files, this should not happen`
    );
  }

  const timestamp = dbGetTimestamp();

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
      region: true,
    },
  });

  if (sourceFiles.length === 0) {
    throw new HTTPError(
      500,
      `source ${sourceId} has no files, this should not happen`
    );
  }

  const maxSourceFileSize = Math.max(
    ...sourceFiles.map((sourceFile) => sourceFile.fileSize)
  );

  const useGCR = maxSourceFileSize >= USE_GCR_SIZE_THRESHOLD;

  const request: TranscoderRequest = {
    serverRevision: process.env.BUILD_REV || 'unknown',
    callbackPath: TRANSCODER_CALLBACK_API_PATH,
    runner: useGCR ? 'gcr' : 'lambda',
    files: createTranscoderRequestFiles(source.files, {
      // TODO(prod): make this configurable
      defaultUnknownAlbumArtist: 'Unknown Artist',
      defaultUnknownAlbumTitle: 'Unknown Album',
      defaultUnknownTrackArtist: 'Unknown Artist',
      defaultUnknownTrackTitle: 'Unknown Track',
      useFilenameAsUnknownTrackTitle: true,
      useTrackArtistAsUnknownAlbumArtist: true,
      useTrackTitleAsUnknownAlbumTitle: true,
      guessDiscNumberUsingFilenameForCue: true,
      guessDiscNumberUsingFilename: true,
      guessTrackNumberUsingFilename: true,
      extractImages: true,
      preferExternalCueSheet: true,
    }),
  };

  await invokeTranscoder(request, sourceFiles[0].region as OSRegion);
}

function invokeTranscodeBySourceSync(userId: string, sourceId: string): void {
  invokeTranscoderBySource(userId, sourceId).catch((error) => {
    logger.error(error, 'invokeTranscoderBySource failed');
  });
}

async function onSourceFileUpdated(
  userId: string,
  sourceId: string,
  timestamp: DBTimestamp
): Promise<void> {
  // NOTE: `uploaded`?????????????????????????????????????????????????????????????????????????????????
  const sourceFiles = await client.sourceFile.findMany({
    where: {
      sourceId,
      userId,
    },
    select: {
      state: true,
    },
  });

  const someFilesAborted = sourceFiles.some(
    (file) => file.state === is<SourceFileState>('upload_aborted')
  );
  const someFilesFailed = sourceFiles.some(
    (file) => file.state === is<SourceFileState>('upload_failed')
  );
  const allFilesUploaded =
    !someFilesAborted &&
    !someFilesFailed &&
    sourceFiles.every((file) => file.state === is<SourceFileState>('uploaded'));
  if (!someFilesAborted && !someFilesFailed && !allFilesUploaded) {
    // upload in progress
    await dbResourceUpdateTimestamp(userId);
    return;
  }

  const updated = await client.source.updateMany({
    where: {
      id: sourceId,
      userId,
      // checking the state is required as it may be executed at the same time as the change from 'uploaded' to 'transcoding'
      state: is<SourceState>('uploading'),
    },
    data: {
      state: is<SourceState>(
        allFilesUploaded
          ? 'uploaded'
          : someFilesAborted
          ? 'upload_aborted'
          : 'upload_failed'
      ),
      updatedAt: timestamp,
    },
  });
  if (!updated.count) {
    // updated by another process
    return;
  }

  if (allFilesUploaded) {
    // start transcode
    await dbResourceUpdateTimestamp(userId);

    invokeTranscodeBySourceSync(userId, sourceId);
  } else {
    // delete uploaded files
    const sourceFiles = await client.sourceFile.findMany({
      where: {
        userId,
        sourceId,
      },
      select: {
        id: true,
        state: true,
        uploadId: true,
        region: true,
        sourceId: true,
        userId: true,
      },
    });

    for (const sourceFile of sourceFiles) {
      const { uploadId } = sourceFile;

      if (uploadId) {
        const os = getSourceFileOS(sourceFile.region as OSRegion);
        const key = getSourceFileKey(userId, sourceId, sourceFile.id);
        const s3 = createUserUploadS3Cached(os);

        // abort multipart upload
        await retryS3NoReject(() =>
          s3.abortMultipartUpload({
            Bucket: os.bucket,
            Key: key,
            UploadId: uploadId,
          })
        );
      }
    }

    await osDeleteSourceFiles(sourceFiles);

    await dbResourceUpdateTimestamp(userId);
  }
}

/**
 * ???????????????????????????????????????????????????????????????????????????????????????????????? \
 * ???DB???????????????????????????????????????????????????
 * @param userId
 * @param sourceId
 * @param sourceFileId
 * @returns
 */
export async function onSourceFileFailed(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  aborted: boolean
): Promise<void> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    select: {
      state: true,
      source: {
        select: {
          state: true,
        },
      },
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `source file ${sourceFileId} not found`);
  }

  if (sourceFile.state !== is<SourceFileState>('uploading')) {
    throw new HTTPError(
      409,
      `source file ${sourceFileId} already aborted, failed or uploaded`
    );
  }

  if (sourceFile.source.state !== is<SourceState>('uploading')) {
    throw new HTTPError(500, `state of the source ${sourceId} is inconsistent`);
  }

  const timestamp = dbGetTimestamp();

  const updated = await client.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
      state: is<SourceFileState>('uploading'),
    },
    data: {
      state: is<SourceFileState>(aborted ? 'upload_aborted' : 'upload_failed'),
      entityExists: false,
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

/**
 * ???????????????????????????????????????????????????????????????????????????????????????????????? \
 * ???DB???????????????????????????????????????????????????
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
  eTags: readonly string[]
): Promise<void> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    select: {
      state: true,
      region: true,
      fileSize: true,
      uploadId: true,
      source: {
        select: {
          state: true,
        },
      },
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

  const partLength = splitIntoParts(sourceFile.fileSize).length;
  if (eTags.length !== partLength) {
    throw new HTTPError(
      400,
      `ETag count of the source file ${sourceFileId} is inconsistent`
    );
  }

  // complete multipart upload
  const os = getSourceFileOS(sourceFile.region as OSRegion);
  const key = getSourceFileKey(userId, sourceId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  // TODO(prod): error handling
  await retryS3(() =>
    s3.completeMultipartUpload({
      Bucket: os.bucket,
      Key: key,
      UploadId: sourceFile.uploadId,
      MultipartUpload: {
        Parts: eTags.map((eTag, index) => ({
          PartNumber: index + 1,
          ETag: eTag,
        })),
      },
    })
  );

  const timestamp = dbGetTimestamp();

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
