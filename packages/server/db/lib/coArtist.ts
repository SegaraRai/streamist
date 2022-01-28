import type { Prisma, PrismaClient } from '@prisma/client';
import { DBTimestamp } from './timestamp';
import type { TransactionalPrismaClient } from './types';

const COL_ID = 'id' as const;
const COL_USER_ID = 'userId' as const;
const COL_ROLE = 'role' as const;
const COL_ARTIST_ID = 'artistId' as const;
const COL_UPDATED_AT = 'updatedAt' as const;

export interface CoArtistTable {
  [COL_ID]: typeof COL_ID;
  [COL_USER_ID]: typeof COL_USER_ID;
  [COL_ROLE]: typeof COL_ROLE;
  [COL_ARTIST_ID]: typeof COL_ARTIST_ID;
  [COL_UPDATED_AT]: typeof COL_UPDATED_AT;
}

export async function dbCoArtistMergeTx<T extends CoArtistTable>(
  txClient: TransactionalPrismaClient | PrismaClient,
  table: Prisma.ModelName,
  entityColumn: T[keyof T],
  userId: string,
  entityId: string,
  toEntityId: string,
  timestamp: DBTimestamp
): Promise<void> {
  // TODO: test this
  await txClient.$executeRawUnsafe(
    `
    UPDATE "${table}"
      SET
        "${entityColumn}" = $1,
        "${COL_UPDATED_AT}" = $2
      WHERE
        "${COL_USER_ID}" = $3 AND
        "${entityColumn}" = $4 AND
        NOT EXISTS (
          SELECT 1
            FROM "${table}" "A"
            WHERE
              "A"."${COL_USER_ID}" = $5 AND "A"."${entityColumn}" = $6 AND
              "A"."${COL_ROLE}" = "${table}"."${COL_ROLE}" AND "A"."${COL_ARTIST_ID}" = "${table}"."${COL_ARTIST_ID}"
        )
    `,
    toEntityId,
    timestamp,
    userId,
    entityId,
    userId,
    toEntityId
  );
  // we don't have to delete the old entity, because it will be cascade deleted
}

export async function dbCoArtistMergeArtistTx<T extends CoArtistTable>(
  txClient: TransactionalPrismaClient | PrismaClient,
  table: Prisma.ModelName,
  entityColumn: T[keyof T],
  userId: string,
  artistId: string,
  toArtistId: string,
  timestamp: DBTimestamp
): Promise<void> {
  // TODO: test this
  await txClient.$executeRawUnsafe(
    `
    UPDATE "${table}"
      SET
        "${COL_ARTIST_ID}" = $1,
        "${COL_UPDATED_AT}" = $2
      WHERE
        "${COL_USER_ID}" = $3 AND
        "${COL_ARTIST_ID}" = $4 AND
        NOT EXISTS (
          SELECT 1
            FROM "${table}" "A"
            WHERE
              "A"."${COL_USER_ID}" = $5 AND "A"."${COL_ARTIST_ID}" = $6 AND
              "A"."${COL_ROLE}" = "${table}"."${COL_ROLE}" AND "A"."${entityColumn}" = "${table}"."${entityColumn}"
        )
    `,
    toArtistId,
    timestamp,
    userId,
    artistId,
    userId,
    toArtistId
  );
  // we have to delete the old entity explicitly, because it won't be cascade deleted
  await txClient.$executeRawUnsafe(
    `
    DELETE
      FROM "${table}"
      WHERE
        "${COL_USER_ID}" = $1 AND
        "${COL_ARTIST_ID}" = $2
    `,
    userId,
    artistId
  );
}
