import { Image, ImageFile } from '@prisma/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { osDeleteImageFiles } from '$/os/imageFile';
import { sourceFileDeleteFromOSIfUnreferenced } from './sourceFiles';

export async function imageDeleteFilesAndSourceFiles(
  userId: string,
  images: readonly Readonly<
    Pick<Image, 'id' | 'sourceFileId'> & {
      readonly files: readonly Readonly<
        Pick<ImageFile, 'id' | 'extension' | 'region'>
      >[];
    }
  >[],
  skipUpdateTimestamp = false
): Promise<void> {
  // delete source files (if not referenced)
  for (const sourceFileId of new Set(
    images.map((image) => image.sourceFileId)
  )) {
    await sourceFileDeleteFromOSIfUnreferenced(userId, sourceFileId, true);
  }

  // update resource timestamp
  if (!skipUpdateTimestamp) {
    await dbResourceUpdateTimestamp(userId);
  }

  // delete image files from S3
  await osDeleteImageFiles(
    userId,
    images.flatMap((image) => image.files)
  );
}
