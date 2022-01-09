import type { TrackFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared/objectStorage';

export async function osDeleteTrackFiles(
  userId: string,
  trackFiles: readonly Pick<TrackFile, 'region' | 'id' | 'extension'>[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(trackFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getTranscodedAudioFileOS(region as OSRegion);
    await osDelete(
      os,
      regionFiles.map((file): string =>
        getTranscodedAudioFileKey(userId, file.id, file.extension)
      )
    );
  }
}
