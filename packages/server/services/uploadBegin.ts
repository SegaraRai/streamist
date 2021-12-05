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
  SOURCE_FILE_CACHE_CONTROL,
  SOURCE_FILE_CONTENT_ENCODING,
  SOURCE_FILE_CONTENT_TYPE,
} from '$shared/sourceFileConfig.js';
import { client } from '$/db/lib/client.js';
import { SourceFileType, SourceState } from '$/db/lib/types.js';
import type {
  CreateSourceRequestAudio,
  CreateSourceRequestImage,
  CreateSourceResponse,
  UploadURL,
  UploadURLPart,
} from '$/types/index.js';
import { HTTPError } from '$/utils/httpError.js';
import { splitIntoParts, useMultipartUpload } from './uploadConfig.js';
import { createUserS3Cached } from './userOS.js';

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
  const s3 = createUserS3Cached(os);

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
  const s3 = createUserS3Cached(os);

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
          })
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
  const s3 = createUserS3Cached(os);

  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: os.bucket,
      Key: key,
      ContentLength: fileSize,
      CacheControl: SOURCE_FILE_CACHE_CONTROL,
      ContentType: SOURCE_FILE_CONTENT_TYPE,
      ContentEncoding: SOURCE_FILE_CONTENT_ENCODING,
    })
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

  // TODO(security): validate request, check file size

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

  await client.source.create({
    data: {
      id: sourceId,
      state: is<SourceState>('initial'),
      user: { connect: { id: userId } },
      files: {
        create: [
          {
            id: audioFileId,
            type: is<SourceFileType>('audio'),
            region,
            filename: String(request.audioFile.filename),
            fileSize: Number(request.audioFile.fileSize),
            sha256: null,
            cueSheetFileId,
            albumId: null,
            uploaded: false,
            uploadId,
            user: { connect: { id: userId } },
          },
          ...(request.cueSheetFile
            ? [
                {
                  id: cueSheetFileId!,
                  type: is<SourceFileType>('cueSheet'),
                  region,
                  filename: String(request.cueSheetFile.filename),
                  fileSize: Number(request.cueSheetFile.fileSize),
                  sha256: null,
                  cueSheetFileId: null,
                  albumId: null,
                  uploaded: false,
                  uploadId: null,
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
        request: request.audioFile,
        sourceFileId: audioFileId,
        uploadURL: await createUploadURL(
          userId,
          audioFileId,
          region,
          request.audioFile.fileSize,
          uploadId
        ),
      },
    ],
  };
}

export async function createImageSource(
  userId: string,
  request: CreateSourceRequestImage
): Promise<CreateSourceResponse> {
  const region = toRegion(request.region);

  // TODO(security): validate request, check file size

  if (
    (await client.album.count({
      where: {
        id: request.albumId,
        userId,
      },
    })) === 0
  ) {
    throw new HTTPError(404, `album ${request.albumId} not found`);
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
      state: is<SourceState>('initial'),
      user: { connect: { id: userId } },
      files: {
        create: [
          {
            id: imageFileId,
            type: is<SourceFileType>('image'),
            region,
            filename: String(request.imageFile.filename),
            fileSize: Number(request.imageFile.fileSize),
            sha256: null,
            cueSheetFileId: null,
            albumId: request.albumId,
            uploaded: false,
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
        request: request.imageFile,
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
    sourceFile.uploaded ||
    sourceFile.source.state !== is<SourceState>('initial')
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
