import { PutObjectCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  generateSourceFileId,
  generateSourceId,
} from '$shared-server/generateId.js';
import {
  getSourceFileKey,
  getSourceFileOS,
} from '$shared-server/objectStorages.js';
import { is } from '$shared/is.js';
import { Region, toRegion } from '$shared/regions.js';
import {
  MAX_SOURCE_AUDIO_FILE_SIZE,
  MAX_SOURCE_CUE_SHEET_FILE_SIZE,
  MAX_SOURCE_IMAGE_FILE_SIZE,
  MIN_SOURCE_FILE_SIZE,
  SOURCE_FILE_CACHE_CONTROL,
  SOURCE_FILE_CONTENT_ENCODING,
  SOURCE_FILE_CONTENT_TYPE,
  SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN,
  SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN_MULTIPART,
} from '$shared/sourceFileConfig.js';
import {
  SourceFileState,
  SourceFileType,
  SourceState,
  toSourceFileAttachToType,
} from '$shared/types/db.js';
import { client } from '$/db/lib/client.js';
import type {
  CreateSourceRequestAudio,
  CreateSourceRequestImage,
  CreateSourceResponse,
  UploadURL,
  UploadURLPart,
} from '$/types/index.js';
import { HTTPError } from '$/utils/httpError.js';
import { splitIntoParts, useMultipartUpload } from './uploadConfig.js';
import { createUserUploadS3Cached } from './userOS.js';

/**
 * @note mutates S3
 * @param userId
 * @param sourceFileId
 * @param region
 * @param fileSize
 * @returns uploadId (`undefined` if fileSize is too small so that multipart upload is not needed)
 */
async function createMultipartUploadId(
  userId: string,
  sourceFileId: string,
  region: Region,
  fileSize: number
): Promise<string | undefined> {
  const useMultipart = useMultipartUpload(fileSize);
  if (!useMultipart) {
    return;
  }

  const os = getSourceFileOS(region);
  const key = getSourceFileKey(userId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  const response = await s3.createMultipartUpload({
    Bucket: os.bucket,
    Key: key,
    CacheControl: SOURCE_FILE_CACHE_CONTROL,
    ContentEncoding: SOURCE_FILE_CONTENT_ENCODING,
    ContentType: SOURCE_FILE_CONTENT_TYPE,
  });

  return response.UploadId;
}

function createPresignedMultipartURLs(
  userId: string,
  sourceFileId: string,
  region: Region,
  fileSize: number,
  uploadId: string
): Promise<UploadURLPart[]> {
  const partSizes = splitIntoParts(fileSize);

  const os = getSourceFileOS(region);
  const key = getSourceFileKey(userId, sourceFileId);
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
            expiresIn: SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN_MULTIPART,
          }
        ),
      })
    )
  );
}

function createPresignedURL(
  userId: string,
  sourceFileId: string,
  region: Region,
  fileSize: number
): Promise<string> {
  const os = getSourceFileOS(region);
  const key = getSourceFileKey(userId, sourceFileId);
  const s3 = createUserUploadS3Cached(os);

  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: os.bucket,
      Key: key,
      ContentLength: fileSize,
      CacheControl: SOURCE_FILE_CACHE_CONTROL,
      ContentType: SOURCE_FILE_CONTENT_TYPE,
      ContentEncoding: SOURCE_FILE_CONTENT_ENCODING,
    }),
    {
      expiresIn: SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN,
    }
  );
}

/**
 * @param userId
 * @param sourceFileId
 * @param region
 * @param fileSize
 * @param uploadId uploadId (only needed for multipart upload)
 * @returns
 */
async function createUploadURL(
  userId: string,
  sourceFileId: string,
  region: Region,
  fileSize: number,
  uploadId?: string | null
): Promise<UploadURL> {
  if (uploadId) {
    return {
      url: null,
      size: fileSize,
      parts: await createPresignedMultipartURLs(
        userId,
        sourceFileId,
        region,
        fileSize,
        uploadId
      ),
    };
  }

  return {
    url: await createPresignedURL(userId, sourceFileId, region, fileSize),
    size: fileSize,
    parts: null,
  };
}

export async function createAudioSource(
  userId: string,
  request: CreateSourceRequestAudio
): Promise<CreateSourceResponse> {
  const region = toRegion(request.region);

  // TODO(security): validate request

  if (request.audioFile.fileSize < MIN_SOURCE_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.audioFile.fileSize} is too small`
    );
  }

  if (request.audioFile.fileSize > MAX_SOURCE_AUDIO_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.audioFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_AUDIO_FILE_SIZE}`
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
    request.cueSheetFile.fileSize > MAX_SOURCE_CUE_SHEET_FILE_SIZE
  ) {
    throw new HTTPError(
      400,
      `File size ${request.cueSheetFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_CUE_SHEET_FILE_SIZE}`
    );
  }

  const sourceId = await generateSourceId();
  const audioFileId = await generateSourceFileId();
  const cueSheetFileId = request.cueSheetFile
    ? await generateSourceFileId()
    : null;

  const uploadId =
    (await createMultipartUploadId(
      userId,
      audioFileId,
      region,
      request.audioFile.fileSize
    )) ?? null;

  const cueSheetUploadId =
    request.cueSheetFile && cueSheetFileId
      ? await createMultipartUploadId(
          userId,
          cueSheetFileId,
          region,
          request.cueSheetFile.fileSize
        )
      : null;

  await client.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('uploading'),
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
            entityExists: false,
            uploadId,
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
                  entityExists: false,
                  uploadId: cueSheetUploadId,
                  user: { connect: { id: userId } },
                },
              ]
            : []),
        ],
      },
    },
  });

  return {
    sourceId,
    files: [
      {
        requestFile: request.audioFile,
        sourceFileId: audioFileId,
        uploadURL: await createUploadURL(
          userId,
          audioFileId,
          region,
          request.audioFile.fileSize,
          uploadId
        ),
      },
      ...(request.cueSheetFile
        ? [
            {
              requestFile: request.cueSheetFile,
              sourceFileId: cueSheetFileId!,
              uploadURL: await createUploadURL(
                userId,
                cueSheetFileId!,
                region,
                request.cueSheetFile.fileSize,
                cueSheetUploadId
              ),
            },
          ]
        : []),
    ],
  };
}

export async function createImageSource(
  userId: string,
  request: CreateSourceRequestImage
): Promise<CreateSourceResponse> {
  const region = toRegion(request.region);

  // TODO(security): validate request

  if (request.imageFile.fileSize < MIN_SOURCE_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.imageFile.fileSize} is too small`
    );
  }

  if (request.imageFile.fileSize > MAX_SOURCE_IMAGE_FILE_SIZE) {
    throw new HTTPError(
      400,
      `File size ${request.imageFile.fileSize} exceeds maximum allowed size of ${MAX_SOURCE_IMAGE_FILE_SIZE}`
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

    default:
      throw new HTTPError(400, `invalid attachToType ${request.attachToType}`);
  }

  const sourceId = await generateSourceId();
  const imageFileId = await generateSourceFileId();

  const uploadId =
    (await createMultipartUploadId(
      userId,
      imageFileId,
      region,
      request.imageFile.fileSize
    )) ?? null;

  await client.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('uploading'),
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
            entityExists: false,
            uploadId,
            user: { connect: { id: userId } },
          },
        ],
      },
    },
  });

  return {
    sourceId,
    files: [
      {
        requestFile: request.imageFile,
        sourceFileId: imageFileId,
        uploadURL: await createUploadURL(
          userId,
          imageFileId,
          region,
          request.imageFile.fileSize,
          uploadId
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
    include: {
      source: true,
    },
  });

  if (!sourceFile) {
    throw new HTTPError(404, `source file ${sourceFileId} not found`);
  }

  if (
    sourceFile.state !== is<SourceFileState>('uploading') ||
    sourceFile.source.state !== is<SourceState>('uploading')
  ) {
    throw new HTTPError(409, `source file ${sourceFileId} already uploaded`);
  }

  return createUploadURL(
    userId,
    sourceFileId,
    sourceFile.region as Region,
    sourceFile.fileSize,
    sourceFile.uploadId
  );
}
