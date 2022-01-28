import type { DeletionEntityType } from '$shared/types';
import { logger } from '$/services/logger';
import { client } from './client';
import { dbGetTimestamp } from './timestamp';
import type { TransactionalPrismaClient } from './types';

/**
 * this function will not throw exceptions
 * @param userId
 */
export async function dbResourceUpdateTimestamp(userId: string): Promise<void> {
  try {
    const updatedAt = dbGetTimestamp();
    await client.resourceUpdate.updateMany({
      where: {
        userId,
        updatedAt: {
          lt: updatedAt,
        },
      },
      data: {
        updatedAt,
      },
    });
  } catch (error) {
    logger.error(
      error,
      `dbResourceUpdateTimestamp: failed (userId = ${userId})`
    );
  }
}

export async function dbDeletionAddTx(
  txClient: TransactionalPrismaClient,
  userId: string,
  type: DeletionEntityType,
  ids: string | readonly string[]
): Promise<void> {
  if (typeof ids === 'string') {
    ids = [ids];
  }

  // TODO(db): use createMany for PostgreSQL
  for (const id of ids) {
    await txClient.deletion.create({
      data: {
        entityType: type,
        entityId: id,
        deletedAt: dbGetTimestamp(),
        userId,
      },
    });
  }
}
