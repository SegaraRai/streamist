import type { ObjectStorage } from './types';

export function getOSRawURL(os: ObjectStorage, key: string): string {
  switch (os.provider) {
    case 'r2':
      throw new Error('getOSRawURL: Cloudflare R2 is not GA yet');

    case 'wasabi':
      return `https://s3.${os.region}.wasabisys.com/${os.bucket}/${key}`;
  }
}

export function getOSCDNURL(os: ObjectStorage, key: string): string {
  return `https://${os.bucket}/${key}`;
}
