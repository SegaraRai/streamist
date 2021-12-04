import { S3 } from '@aws-sdk/client-s3';
import { createHash, Hash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { PassThrough, Readable } from 'node:stream';
import { decodeBuffer } from './contentEncoding.js';
import { nodeReadableStreamToBuffer } from './stream.js';

export interface ObjectStorageCredentials {
  readonly WASABI_ACCESS_KEY_ID: string;
  readonly WASABI_SECRET_ACCESS_KEY: string;
}

export interface ObjectStorage {
  readonly provider: 'r2' | 'wasabi';
  readonly region: string;
  readonly bucket: string;
}

export interface ObjectStorageUploadOptions {
  contentType: string;
  cacheControl: string;
  contentEncoding?: string;
  contentDisposition?: string;
}

let gCredentials: ObjectStorageCredentials | undefined;

export function setOSCredentials(credentials: ObjectStorageCredentials) {
  if (gCredentials) {
    throw new Error('credentials already set');
  }

  gCredentials = { ...credentials };
}

const gS3CacheMap = new Map<string, S3>();

function createS3Cached(objectStorage: ObjectStorage): S3 {
  if (!gCredentials) {
    throw new Error('credentials not set');
  }

  const key = `os://${objectStorage.provider}/${objectStorage.region}`;

  let s3 = gS3CacheMap.get(key);
  if (!s3) {
    switch (objectStorage.provider) {
      case 'r2':
        throw new Error('Cloudflare R2 is not GA yet');

      case 'wasabi':
        s3 = new S3({
          endpoint: `https://${objectStorage.region}.wasabisys.com`,
          region: objectStorage.region,
          credentials: {
            accessKeyId: gCredentials.WASABI_ACCESS_KEY_ID,
            secretAccessKey: gCredentials.WASABI_SECRET_ACCESS_KEY,
          },
        });
        break;
    }
    gS3CacheMap.set(key, s3);
  }

  return s3;
}

export async function osPutData(
  objectStorage: ObjectStorage,
  key: string,
  data: Buffer,
  options: ObjectStorageUploadOptions
): Promise<void> {
  // compression is not currently supported
  const s3 = createS3Cached(objectStorage);
  await s3.putObject({
    Bucket: objectStorage.bucket,
    Key: key,
    Body: data,
    CacheControl: options.cacheControl,
    ContentType: options.contentType,
    ContentDisposition: options.contentDisposition,
    ContentEncoding: options.contentEncoding,
  });
}

export async function osPutFile(
  objectStorage: ObjectStorage,
  key: string,
  filepath: string,
  options: ObjectStorageUploadOptions,
  hash?: string | Hash
): Promise<Buffer | undefined> {
  // compression is not currently supported
  const s3 = createS3Cached(objectStorage);
  const stream = createReadStream(filepath);
  const hash2 = typeof hash === 'string' ? createHash(hash) : hash;
  let passThrough: PassThrough | undefined;
  if (hash2) {
    stream.on('data', (chunk) => {
      hash2.update(chunk);
    });
    // PassThrough is needed to read data along with sending it to the S3 stream (https://stackoverflow.com/a/37366093)
    // do not listen passThrough's data events, or it won't be sent to S3
    passThrough = new PassThrough();
    stream.pipe(passThrough);
  }
  await s3.putObject({
    Bucket: objectStorage.bucket,
    Key: key,
    Body: passThrough || stream,
    CacheControl: options.cacheControl,
    ContentType: options.contentType,
    ContentDisposition: options.contentDisposition,
    ContentEncoding: options.contentEncoding,
  });
  return hash2?.digest();
}

export async function osGetData(
  objectStorage: ObjectStorage,
  key: string
): Promise<Buffer> {
  const s3 = createS3Cached(objectStorage);
  const response = await s3.getObject({
    Bucket: objectStorage.bucket,
    Key: key,
  });
  const buffer = await nodeReadableStreamToBuffer(response.Body as Readable);
  return decodeBuffer(buffer, response.ContentEncoding);
}

export async function osGetFile(
  objectStorage: ObjectStorage,
  key: string,
  filepath: string,
  hash?: string | Hash
): Promise<Buffer | undefined> {
  // decompression is not currently supported
  const s3 = createS3Cached(objectStorage);
  const response = await s3.getObject({
    Bucket: objectStorage.bucket,
    Key: key,
  });
  const hash2 = typeof hash === 'string' ? createHash(hash) : hash;
  return new Promise<Buffer | undefined>((resolve, reject) => {
    const rStream = response.Body as Readable;
    const wStream = createWriteStream(filepath);

    if (hash2) {
      rStream.on('data', (chunk) => {
        hash2.update(chunk);
      });
    }

    rStream
      .once('error', (error) => {
        wStream.destroy(error);
        reject(error);
      })
      .pipe(wStream)
      .once('error', (error) => {
        rStream.destroy(error);
        reject(error);
      })
      .once('close', () => {
        resolve(hash2?.digest());
      });
  });
}
