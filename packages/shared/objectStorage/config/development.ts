import type { ObjectStorageDefinition } from '../types';

export const configDevelopment: ObjectStorageDefinition = {
  'ap-northeast-1': {
    region: 'ap-northeast-1',
    name: 'Tokyo (Wasabi)',
    buckets: {
      transcodeLog: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'development-wasabi-ap-northeast-1.stst.page',
      },
      transcodedAudioFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'development-wasabi-ap-northeast-1.stst.page',
      },
      transcodedImageFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'development-wasabi-ap-northeast-1.stst.page',
      },
      sourceFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'development-wasabi-ap-northeast-1.stst.page',
      },
    },
  },
};
