import { S3 } from '@aws-sdk/client-s3';
import type { ObjectStorage } from '$shared-server/objectStorage';
import {
  SECRET_USER_WASABI_ACCESS_KEY_ID,
  SECRET_USER_WASABI_SECRET_ACCESS_KEY,
} from './env';

const gS3CacheMap = new Map<string, S3>();

export function createUserS3Cached(objectStorage: ObjectStorage): S3 {
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
            accessKeyId: SECRET_USER_WASABI_ACCESS_KEY_ID,
            secretAccessKey: SECRET_USER_WASABI_SECRET_ACCESS_KEY,
          },
        });
        break;
    }
    gS3CacheMap.set(key, s3);
  }

  return s3;
}
