import type { DeletionEntityType } from '../../types/db';
import { client } from './client';
import type { TransactionalPrismaClient } from './types';

/**
 * this function will not throw exceptions
 * @param userId
 */
export async function dbResourceUpdateTimestamp(userId: string): Promise<void> {
  try {
    const updatedAt = Date.now();
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
  } catch (e) {
    console.error(e);
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
        deletedAt: Date.now(),
        userId,
      },
    });
  }
}
