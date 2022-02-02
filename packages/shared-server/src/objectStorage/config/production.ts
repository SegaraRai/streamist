import { regionsProduction, useRegionsProduction } from '$shared/objectStorage';
import { setOS } from '../set';
import type { ObjectStorageRegion } from '../types';

export const configProduction: Record<
  typeof regionsProduction[number],
  ObjectStorageRegion
> = {
  'ap-northeast-1': {
    region: 'ap-northeast-1',
    transcoderLambdaRegion: 'ap-northeast-1',
    transcoderLambdaName: 'streamist-production-transcoder-ap-northeast-1',
    transcoderGCRProject: 'streamist-production',
    transcoderGCRRegion: 'asia-northeast1',
    transcoderGCRName: 'streamist-production-transcoder-ap-northeast-1',
    transcoderGCROrigin:
      'https://streamist-production-transcoder-ap-northeast-1-6zh6thay5q-an.a.run.app',
    transcoderGCRTasksQueueName: 'production-transcoder-queue-ap-northeast-1',
    buckets: {
      transcodeLog: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'ap-northeast-1-transcoded.stst.page',
      },
      transcodedAudioFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'ap-northeast-1-transcoded.stst.page',
      },
      transcodedImageFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'ap-northeast-1-transcoded.stst.page',
      },
      sourceFile: {
        provider: 'wasabi',
        region: 'ap-northeast-1',
        bucket: 'ap-northeast-1-source.stst.page',
      },
    },
  },
};

export function useConfigProduction(): void {
  // this must be called before setOS
  useRegionsProduction();
  setOS(configProduction);
}
