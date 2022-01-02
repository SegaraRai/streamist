import type { SourceFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import {
  getSourceFileKey,
  getSourceFileOS,
} from '$shared-server/objectStorages';
import { createMultiMap } from '$shared/multiMap';
import type { Region } from '$shared/regions';

export async function osDeleteSourceFiles(
  userId: string,
  sourceFiles: readonly Pick<SourceFile, 'region' | 'id'>[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(sourceFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getSourceFileOS(region as Region);
    await osDelete(
      os,
      regionFiles.map((file): string => getSourceFileKey(userId, file.id))
    );
  }
}
