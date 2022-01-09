import type { SourceFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
} from '$shared/objectStorage';

export async function osDeleteSourceFiles(
  userId: string,
  sourceFiles: readonly Pick<SourceFile, 'region' | 'id'>[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(sourceFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getSourceFileOS(region as OSRegion);
    await osDelete(
      os,
      regionFiles.map((file): string => getSourceFileKey(userId, file.id))
    );
  }
}
