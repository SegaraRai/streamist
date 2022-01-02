import type { ImageFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import {
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages';
import { createMultiMap } from '$shared/multiMap';
import type { Region } from '$shared/regions';

export async function osDeleteImageFiles(
  userId: string,
  imageFiles: readonly Pick<ImageFile, 'region' | 'id' | 'extension'>[]
): Promise<void> {
  const regionToImageFilesMap = createMultiMap(imageFiles, 'region');
  for (const [region, regionImageFiles] of regionToImageFilesMap) {
    const os = getTranscodedImageFileOS(region as Region);
    await osDelete(
      os,
      regionImageFiles.map((file) =>
        getTranscodedImageFileKey(userId, file.id, file.extension)
      )
    );
  }
}
