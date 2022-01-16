import { S3 } from '@aws-sdk/client-s3';
import type { ObjectStorage } from '$shared-server/objectStorage';
import {
  SECRET_USER_DOWNLOAD_WASABI_ACCESS_KEY_ID,
  SECRET_USER_DOWNLOAD_WASABI_SECRET_ACCESS_KEY,
  SECRET_USER_UPLOAD_WASABI_ACCESS_KEY_ID,
  SECRET_USER_UPLOAD_WASABI_SECRET_ACCESS_KEY,
} from '$/services/env';

const gUserDownloadS3CacheMap = new Map<string, S3>();

export function createUserDownloadS3Cached(objectStorage: ObjectStorage): S3 {
  const key = `os://${objectStorage.provider}/${objectStorage.region}`;

  let s3 = gUserDownloadS3CacheMap.get(key);
  if (!s3) {
    switch (objectStorage.provider) {
      case 'r2':
        throw new Error('Cloudflare R2 is not GA yet');

      case 'wasabi':
        s3 = new S3({
          endpoint: `https://${objectStorage.region}.wasabisys.com`,
          region: objectStorage.region,
          credentials: {
            accessKeyId: SECRET_USER_DOWNLOAD_WASABI_ACCESS_KEY_ID,
            secretAccessKey: SECRET_USER_DOWNLOAD_WASABI_SECRET_ACCESS_KEY,
          },
        });
        break;
    }
    gUserDownloadS3CacheMap.set(key, s3);
  }

  return s3;
}

const gUserUploadS3CacheMap = new Map<string, S3>();

export function createUserUploadS3Cached(objectStorage: ObjectStorage): S3 {
  const key = `os://${objectStorage.provider}/${objectStorage.region}`;

  let s3 = gUserUploadS3CacheMap.get(key);
  if (!s3) {
    switch (objectStorage.provider) {
      case 'r2':
        throw new Error('Cloudflare R2 is not GA yet');

      case 'wasabi':
        s3 = new S3({
          endpoint: `https://${objectStorage.region}.wasabisys.com`,
          region: objectStorage.region,
          credentials: {
            accessKeyId: SECRET_USER_UPLOAD_WASABI_ACCESS_KEY_ID,
            secretAccessKey: SECRET_USER_UPLOAD_WASABI_SECRET_ACCESS_KEY,
          },
        });
        break;
    }
    gUserUploadS3CacheMap.set(key, s3);
  }

  return s3;
}
