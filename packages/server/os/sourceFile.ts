import type { SourceFile } from '@prisma/client';
import { osDelete } from '$shared-server/objectStorage';
import { createMultiMap } from '$shared/multiMap';
import {
  OSRegion,
  getSourceFileKey,
  getSourceFileOS,
} from '$shared/objectStorage';
import { retryS3 } from '$shared/retry';

export async function osDeleteSourceFiles(
  sourceFiles: readonly Pick<
    SourceFile,
    'id' | 'region' | 'sourceId' | 'userId'
  >[]
): Promise<void> {
  const regionToFilesMap = createMultiMap(sourceFiles, 'region');
  for (const [region, regionFiles] of regionToFilesMap) {
    const os = getSourceFileOS(region as OSRegion);
    await retryS3(() =>
      osDelete(
        os,
        regionFiles.map((file): string =>
          getSourceFileKey(file.userId, file.sourceId, file.id)
        )
      )
    );
  }
}
