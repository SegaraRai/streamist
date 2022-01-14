import {
  MAX_SOURCE_FILE_RETENTION_PER_PLAN,
  PLANS,
} from '$shared/config/plans';
import { client } from '$/db/lib/client';
import { osDeleteSourceFiles } from '$/os/sourceFile';

export async function cleanupOverRetentionSourceFiles(): Promise<void> {
  for (const plan of PLANS) {
    const retention = MAX_SOURCE_FILE_RETENTION_PER_PLAN[plan];
    if (retention === Infinity) {
      continue;
    }

    const deleteUploadedAt = Date.now() - retention;

    const sourceFiles = await client.sourceFile.findMany({
      where: {
        entityExists: true,
        uploadedAt: {
          lt: deleteUploadedAt,
        },
        user: {
          plan,
        },
      },
      select: {
        id: true,
        region: true,
        userId: true,
        sourceId: true,
        user: {
          select: {
            plan: true,
          },
        },
      },
    });

    await client.sourceFile.updateMany({
      where: {
        id: {
          in: sourceFiles.map((f) => f.id),
        },
      },
      data: {
        entityExists: false,
        updatedAt: Date.now(),
      },
    });

    await osDeleteSourceFiles(sourceFiles);
  }
}
