import { regionsStaging, useRegionsStaging } from '$shared/objectStorage';
import { setOS } from '../set';
import type { ObjectStorageRegion } from '../types';

export const configStaging: Record<
  typeof regionsStaging[number],
  ObjectStorageRegion
> = {
  'ap-northeast-1': {
    region: 'ap-northeast-1',
    transcoderLambdaRegion: 'ap-northeast-1',
    transcoderLambdaName: 'streamist-staging-transcoder-ap-northeast-1',
    buckets: {
      transcodeLog: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'staging-wasabi-ap-northeast-1-transcoded.stst.page',
      },
      transcodedAudioFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'staging-wasabi-ap-northeast-1-transcoded.stst.page',
      },
      transcodedImageFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'staging-wasabi-ap-northeast-1-transcoded.stst.page',
      },
      sourceFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'staging-wasabi-ap-northeast-1-source.stst.page',
      },
    },
  },
};

export function useConfigStaging(): void {
  // this must be called before setOS
  useRegionsStaging();
  setOS(configStaging);
}
