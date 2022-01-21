export type OSRegion = 'ap-northeast-1';

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
  readonly name: string;
  readonly buckets: ObjectStorageBuckets;
}

export type ObjectStorageDefinition = Record<OSRegion, ObjectStorageRegion>;
