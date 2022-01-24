import type { ImageFile } from '@prisma/client';
import {
  OSRegion,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorage';
import { osDeleteManaged } from '$shared-server/osOperations';
import { createMultiMap } from '$shared/multiMap';

export async function osDeleteImageFiles(
  imageFiles: readonly Pick<
    ImageFile,
    'region' | 'id' | 'extension' | 'imageId' | 'userId'
  >[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(imageFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getTranscodedImageFileOS(region as OSRegion);
    await osDeleteManaged(
      os,
      regionFiles.map((file): string =>
        getTranscodedImageFileKey(
          file.userId,
          file.imageId,
          file.id,
          file.extension
        )
      ),
      true
    );
  }
}
