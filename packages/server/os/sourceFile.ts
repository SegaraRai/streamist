import type { SourceFile } from '@prisma/client';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
  osDeleteManaged,
} from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';

export async function osDeleteSourceFiles(
  sourceFiles: readonly Pick<
    SourceFile,
    'id' | 'region' | 'sourceId' | 'userId'
  >[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(sourceFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getSourceFileOS(region as OSRegion);
    await osDeleteManaged(
      os,
      regionFiles.map((file): string =>
        getSourceFileKey(file.userId, file.sourceId, file.id)
      ),
      true
    );
  }
}
