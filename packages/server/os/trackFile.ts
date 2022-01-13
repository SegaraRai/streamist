import type { TrackFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared/objectStorage';
import { retryS3 } from '$shared/retry';

export async function osDeleteTrackFiles(
  trackFiles: readonly Pick<
    TrackFile,
    'region' | 'id' | 'extension' | 'trackId' | 'userId'
  >[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(trackFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getTranscodedAudioFileOS(region as OSRegion);
    await retryS3(() =>
      osDelete(
        os,
        regionFiles.map((file): string =>
          getTranscodedAudioFileKey(
            file.userId,
            file.trackId,
            file.id,
            file.extension
          )
        )
      )
    );
  }
}
