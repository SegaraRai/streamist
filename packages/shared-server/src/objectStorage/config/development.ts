import {
  regionsDevelopment,
  useRegionsDevelopment,
} from '$shared/objectStorage';
import { setOS } from '../set';
import type { ObjectStorageRegion } from '../types';

export const configDevelopment: Record<
  typeof regionsDevelopment[number],
  ObjectStorageRegion
> = {
  'ap-northeast-1': {
    region: 'ap-northeast-1',
    transcoderLambdaRegion: '',
    transcoderLambdaName: '',
    transcoderGCRProject: '',
    transcoderGCRRegion: '',
    transcoderGCRURL: '',
    transcoderGCRTasksQueueName: '',
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

export function useConfigDevelopment(): void {
  // this must be called before setOS
  useRegionsDevelopment();
  setOS(configDevelopment);
}
