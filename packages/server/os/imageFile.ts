import type { ImageFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared/objectStorage';

export async function osDeleteImageFiles(
  userId: string,
  imageFiles: readonly Pick<ImageFile, 'region' | 'id' | 'extension'>[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(imageFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getTranscodedImageFileOS(region as OSRegion);
    await osDelete(
      os,
      regionFiles.map((file): string =>
        getTranscodedImageFileKey(userId, file.id, file.extension)
      )
    );
  }
}
