import type { ImageFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared/objectStorage';
import { retryS3 } from '$shared/retry';

export async function osDeleteImageFiles(
  imageFiles: readonly Pick<
    ImageFile,
    'region' | 'id' | 'extension' | 'imageId' | 'userId'
  >[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(imageFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getTranscodedImageFileOS(region as OSRegion);
    await retryS3(() =>
      osDelete(
        os,
        regionFiles.map((file): string =>
          getTranscodedImageFileKey(
            file.userId,
            file.imageId,
            file.id,
            file.extension
          )
        )
      )
    );
  }
}
