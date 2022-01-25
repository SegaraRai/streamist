import type { OSRegion } from '$shared/objectStorage';

export interface ObjectStorage {
  readonly provider: 'r2' | 'wasabi';
  readonly region: string;
  readonly bucket: string;
}

export interface ObjectStorageBuckets {
  readonly transcodeLog: ObjectStorage;
  readonly transcodedAudioFile: ObjectStorage;
  readonly transcodedImageFile: ObjectStorage;
  readonly sourceFile: ObjectStorage;
}

export interface ObjectStorageRegion {
  readonly region: OSRegion;
  /** AWS region of transcoder */
  readonly transcoderLambdaRegion: string;
  /** AWS Lambda function name of transcoder */
  readonly transcoderLambdaName: string;
  readonly buckets: ObjectStorageBuckets;
}

export type ObjectStorageDefinition = Partial<
  Record<OSRegion, ObjectStorageRegion>
>;

export interface ObjectStorageCredentials {
  readonly WASABI_ACCESS_KEY_ID: string;
  readonly WASABI_SECRET_ACCESS_KEY: string;
}

export interface ObjectStorageUploadOptions {
  contentType: string;
  cacheControl: string;
  contentEncoding?: string;
  contentDisposition?: string;
}
