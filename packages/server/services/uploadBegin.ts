import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  generateSourceFileId,
  generateSourceId,
} from '$shared-server/generateId';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
  toOSRegion,
} from '$shared-server/objectStorage';
import {
  MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN,
  MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN,
  MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN,
  MIN_SOURCE_FILE_SIZE,
  Plan,
  SOURCE_FILE_CACHE_CONTROL,
  SOURCE_FILE_CONTENT_ENCODING,
  SOURCE_FILE_CONTENT_TYPE,
  SOURCE_FILE_PRESIGNED_URL_MIN_EXPIRES_IN,
  SOURCE_FILE_UPLOADABLE_AFTER_CREATE,
} from '$shared/config';
import { is } from '$shared/is';
import { retryS3 } from '$shared/retry';
import {
  SourceFileState,
  SourceFileType,
  SourceState,
  toSourceFileAttachToType,
} from '$shared/types';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { splitIntoParts } from '$/services/uploadUtils';
import { createUserUploadS3Cached } from '$/services/userOS';
import type {
  CreateSourceRequestAudio,
  CreateSourceRequestImage,
  CreateSourceResponse,
  UploadURL,
  UploadURLPart,
} from '$/types';
import { HTTPError } from '$/utils/httpError';

/**
 * @note mutates S3
 * @param userId
 * @param sourceFileId
 * @param region
 * @returns uploadId
 */
async function createMultipartUploadId(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  region: OSRegion
): Promise<string> {
  const os = getSourceFileOS(region);
  const key = getSourceFileKey(userId, sourceId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  const response = await retryS3(() =>
    s3.createMultipartUpload({
      Bucket: os.bucket,
      Key: key,
      CacheControl: SOURCE_FILE_CACHE_CONTROL,
      ContentEncoding: SOURCE_FILE_CONTENT_ENCODING,
      ContentType: SOURCE_FILE_CONTENT_TYPE,
    })
  );

  if (!response.UploadId) {
    // should not happen
    throw new Error('No uploadId returned');
  }

  return response.UploadId;
}

function createPresignedMultipartURLs(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  region: OSRegion,
  fileSize: number,
  uploadId: string,
  createdAt: number
): Promise<UploadURLPart[]> {
  const partSizes = splitIntoParts(fileSize);

  const os = getSourceFileOS(region);
  const key = getSourceFileKey(userId, sourceId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  return Promise.all(
    partSizes.map(
      async (partSize, index): Promise<UploadURLPart> => ({
        size: partSize,
        url: await getSignedUrl(
          s3,
          new UploadPartCommand({
            Bucket: os.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: index + 1,
            ContentLength: partSize,
          }),
          {
            expiresIn: Math.floor(
              Math.max(
                createdAt + SOURCE_FILE_UPLOADABLE_AFTER_CREATE - Date.now(),
                SOURCE_FILE_PRESIGNED_URL_MIN_EXPIRES_IN
              ) / 1000
            ),
          }
        ),
      })
    )
  );
}

async function createUploadURL(
  userId: string,
  sourceId: string,
  sourceFileId: string,
  region: OSRegion,
  fileSize: number,
  uploadId: string,
  createdAt: number
): Promise<UploadURL> {
  return {
    size: fileSize,
    parts: await createPresignedMultipartURLs(
      userId,
      sourceId,
      sourceFileId,
      region,
      fileSize,
      uploadId,
      createdAt
    ),
  };
}

export async function createAudioSource(
  userId: string,
  plan: Plan,
  request: CreateSourceRequestAudio
): Promise<CreateSourceResponse> {
  const region = toOSRegion(request.region);

  if (request.audioFile.fileSize < MIN_SOURCE_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.audioFile.fileSize} is too small`
    );
  }

  if (request.audioFile.fileSize > MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN[plan]) {
    throw new HTTPError(
      400,
      `File size ${request.audioFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN[plan]}`
    );
  }

  if (
    request.cueSheetFile &&
    request.cueSheetFile.fileSize < MIN_SOURCE_FILE_SIZE
  ) {
    throw new HTTPError(
      400,
      `File size ${request.cueSheetFile.fileSize} is too small`
    );
  }

  if (
    request.cueSheetFile &&
    request.cueSheetFile.fileSize >
      MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN[plan]
  ) {
    throw new HTTPError(
      400,
      `File size ${request.cueSheetFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN[plan]}`
    );
  }

  const sourceId = await generateSourceId();
  const audioFileId = await generateSourceFileId();
  const cueSheetFileId = request.cueSheetFile
    ? await generateSourceFileId()
    : null;

  const uploadId = await createMultipartUploadId(
    userId,
    sourceId,
    audioFileId,
    region
  );

  const cueSheetUploadId = cueSheetFileId
    ? await createMultipartUploadId(userId, sourceId, cueSheetFileId, region)
    : null;

  const nTimestamp = Date.now();
  const timestamp = dbGetTimestamp(nTimestamp);

  await client.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('uploading'),
      createdAt: timestamp,
      updatedAt: timestamp,
      user: { connect: { id: userId } },
      files: {
        create: [
          {
            id: audioFileId,
            state: is<SourceFileState>('uploading'),
            type: is<SourceFileType>('audio'),
            region,
            filename: String(request.audioFile.filename),
            fileSize: Number(request.audioFile.fileSize),
            sha256: null,
            cueSheetFileId,
            attachToType: null,
            attachToId: null,
            attachPrepend: null,
            entityExists: false,
            uploadId,
            createdAt: timestamp,
            updatedAt: timestamp,
            user: { connect: { id: userId } },
          },
          ...(request.cueSheetFile
            ? [
                {
                  id: cueSheetFileId!,
                  state: is<SourceFileState>('uploading'),
                  type: is<SourceFileType>('cueSheet'),
                  region,
                  filename: String(request.cueSheetFile.filename),
                  fileSize: Number(request.cueSheetFile.fileSize),
                  sha256: null,
                  cueSheetFileId: null,
                  attachToType: null,
                  attachToId: null,
                  attachPrepend: null,
                  entityExists: false,
                  uploadId: cueSheetUploadId!,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                  user: { connect: { id: userId } },
                },
              ]
            : []),
        ],
      },
    },
  });

  await dbResourceUpdateTimestamp(userId);

  return {
    sourceId,
    files: [
      {
        requestFile: request.audioFile,
        sourceFileId: audioFileId,
        uploadURL: await createUploadURL(
          userId,
          sourceId,
          audioFileId,
          region,
          request.audioFile.fileSize,
          uploadId,
          nTimestamp
        ),
      },
      ...(request.cueSheetFile
        ? [
            {
              requestFile: request.cueSheetFile,
              sourceFileId: cueSheetFileId!,
              uploadURL: await createUploadURL(
                userId,
                sourceId,
                cueSheetFileId!,
                region,
                request.cueSheetFile.fileSize,
                cueSheetUploadId!,
                nTimestamp
              ),
            },
          ]
        : []),
    ],
  };
}

export async function createImageSource(
  userId: string,
  plan: Plan,
  request: CreateSourceRequestImage
): Promise<CreateSourceResponse> {
  const region = toOSRegion(request.region);

  if (request.imageFile.fileSize < MIN_SOURCE_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.imageFile.fileSize} is too small`
    );
  }

  if (request.imageFile.fileSize > MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN[plan]) {
    throw new HTTPError(
      400,
      `File size ${request.imageFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN[plan]}`
    );
  }

  switch (request.attachToType) {
    case 'album':
      if (
        (await client.album.count({
          where: {
            id: request.attachToId,
            userId,
          },
        })) === 0
      ) {
        throw new HTTPError(404, `album ${request.attachToId} not found`);
      }
      break;

    case 'artist':
      if (
        (await client.artist.count({
          where: {
            id: request.attachToId,
            userId,
          },
        })) === 0
      ) {
        throw new HTTPError(404, `artist ${request.attachToId} not found`);
      }
      break;

    case 'playlist':
      if (
        (await client.playlist.count({
          where: {
            id: request.attachToId,
            userId,
          },
        })) === 0
      ) {
        throw new HTTPError(404, `playlist ${request.attachToId} not found`);
      }
      break;

    default:
      throw new HTTPError(400, `invalid attachToType ${request.attachToType}`);
  }

  const sourceId = await generateSourceId();
  const imageFileId = await generateSourceFileId();

  const uploadId = await createMultipartUploadId(
    userId,
    sourceId,
    imageFileId,
    region
  );

  const nTimestamp = Date.now();
  const timestamp = dbGetTimestamp(nTimestamp);

  await client.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('uploading'),
      createdAt: timestamp,
      updatedAt: timestamp,
      user: { connect: { id: userId } },
      files: {
        create: [
          {
            id: imageFileId,
            state: is<SourceFileState>('uploading'),
            type: is<SourceFileType>('image'),
            region,
            filename: String(request.imageFile.filename),
            fileSize: Number(request.imageFile.fileSize),
            sha256: null,
            cueSheetFileId: null,
            attachToType: toSourceFileAttachToType(request.attachToType),
            attachToId: String(request.attachToId),
            attachPrepend: !!request.attachPrepend,
            entityExists: false,
            uploadId,
            createdAt: timestamp,
            updatedAt: timestamp,
            user: { connect: { id: userId } },
          },
        ],
      },
    },
  });

  await dbResourceUpdateTimestamp(userId);

  return {
    sourceId,
    files: [
      {
        requestFile: request.imageFile,
        sourceFileId: imageFileId,
        uploadURL: await createUploadURL(
          userId,
          sourceId,
          imageFileId,
          region,
          request.imageFile.fileSize,
          uploadId,
          nTimestamp
        ),
      },
    ],
  };
}

export async function getUploadURLForSourceFile(
  userId: string,
  sourceId: string,
  sourceFileId: string
): Promise<UploadURL> {
  const sourceFile = await client.sourceFile.findFirst({
    where: {
      id: sourceFileId,
      sourceId,
      userId,
    },
    select: {
      region: true,
      state: true,
      fileSize: true,
      uploadId: true,
      createdAt: true,
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

  if (
    sourceFile.state !== is<SourceFileState>('uploading') ||
    sourceFile.source.state !== is<SourceState>('uploading')
  ) {
    throw new HTTPError(
      409,
      `source file ${sourceFileId} already uploaded or deleted`
    );
  }

  const nCreatedAt = Number(sourceFile.createdAt);

  if (nCreatedAt + SOURCE_FILE_UPLOADABLE_AFTER_CREATE < Date.now()) {
    throw new HTTPError(403, `source file ${sourceFileId} too old to upload`);
  }

  return createUploadURL(
    userId,
    sourceId,
    sourceFileId,
    sourceFile.region as OSRegion,
    sourceFile.fileSize,
    sourceFile.uploadId,
    nCreatedAt
  );
}

export async function createSource(
  userId: string,
  request: CreateSourceRequestAudio | CreateSourceRequestImage
): Promise<CreateSourceResponse> {
  const user = await client.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      plan: true,
      maxTrackId: true,
      closedAt: true,
    },
  });

  if (!user) {
    throw new HTTPError(404, `user ${userId} not found`);
  }

  if (user.closedAt != null) {
    throw new HTTPError(
      409,
      `User ${userId} is closed. Please sign in again to restore access.`
    );
  }

  const plan = user.plan as Plan;

  switch (request.type) {
    case 'audio':
      if (user.maxTrackId) {
        throw new HTTPError(
          403,
          `user ${userId} has reached maximum number of tracks`
        );
      }
      return createAudioSource(userId, plan, request);

    case 'image':
      return createImageSource(userId, plan, request);
  }
  throw new HTTPError(400, 'invalid type');
}
