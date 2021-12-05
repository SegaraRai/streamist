import type { Prisma } from '$prisma/client';
import { client } from './client';
import type { TransactionalPrismaClient } from './types';

const userIdColumn = 'userId' as const;

interface LinkedListJunctionTable {
  [userIdColumn]: typeof userIdColumn;
}

/**
 * 連結リストの末尾に新規レコードを作成する
 * @param txClient transactional prisma client
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemIds アイテムID（例えばプレイリストならトラックID）
 */
export async function dbLinkedListAppendTx<T extends LinkedListJunctionTable>(
  txClient: TransactionalPrismaClient,
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemIds: string | readonly string[]
): Promise<void> {
  if (typeof itemIds === 'string') {
    itemIds = [itemIds];
  }

  if (itemIds.length === 0) {
    return;
  }

  const firstItemId = itemIds[0];

  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${table}\`
      SET \`${nextItemIdColumn}\` = $1
      WHERE \`${userIdColumn}\` = $2 AND \`${groupIdColumn}\` = $3 AND \`${nextItemIdColumn}\` IS NULL
    `,
    firstItemId,
    userId,
    groupId
  );
  if (updated !== 1) {
    // this happens somehow. why? (dirty read?)
    throw new Error(
      `dbLinkedListAppendTx: failed to UPDATE (table=${table}, userId=${userId}, groupId=${groupId}, itemIds=${itemIds.join()}, affected=${updated})`
    );
  }

  const inserted = await txClient.$executeRawUnsafe(
    `
    INSERT INTO \`${table}\` (\`${userIdColumn}\`, \`${groupIdColumn}\`, \`${itemIdColumn}\`, \`${nextItemIdColumn}\`)
    VALUES ${itemIds.map(() => '(?, ?, ?, ?)').join(', ')}
    `,
    ...itemIds
      .map((itemId, index) => [
        userId,
        groupId,
        itemId,
        itemIds[index + 1] ?? null,
      ])
      .flat()
  );
  if (inserted !== itemIds.length) {
    // how this happen?
    throw new Error(
      `dbLinkedListAppend: failed to INSERT (table=${table}, userId=${userId}, groupId=${groupId}, itemIds=${itemIds.join()}, affected=${inserted})`
    );
  }
}

/**
 * 連結リストの末尾に新規レコードを作成する
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemIds アイテムID（例えばプレイリストならトラックID）
 */
export function dbLinkedListAppend<T extends LinkedListJunctionTable>(
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemIds: string | readonly string[]
): Promise<void> {
  if (typeof itemIds === 'string') {
    itemIds = [itemIds];
  }

  if (itemIds.length === 0) {
    return Promise.resolve();
  }

  return client.$transaction(
    (txClient): Promise<void> =>
      dbLinkedListAppendTx(
        txClient,
        table,
        userId,
        groupIdColumn,
        groupId,
        itemIdColumn,
        nextItemIdColumn,
        itemIds
      )
  );
}

/**
 * 連結リストからレコードを削除する
 * @param txClient transactional prisma client
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemId アイテムID（例えばプレイリストならトラックID）
 */
export async function dbLinkedListRemoveTx<T extends LinkedListJunctionTable>(
  txClient: TransactionalPrismaClient,
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemId: string
): Promise<void> {
  // A (maybe sentinel) -> B (target) -> C (maybe NULL)
  // updating the `nextItemId` of the target avoids the uniqueness constraint violation,
  // but this requires specifying the update order, which is difficult to do (in SQLite),
  // so we do not currently have a uniqueness constraint.
  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${table}\` AS A
      SET \`${nextItemIdColumn}\` = B.\`${nextItemIdColumn}\`
      FROM \`${table}\` AS B
      WHERE
        B.\`${itemIdColumn}\` = $1 AND B.\`${groupIdColumn}\` = A.\`${groupIdColumn}\` AND B.\`${userIdColumn}\` = A.\`${userIdColumn}\` AND
        A.\`${userIdColumn}\` = $2 AND A.\`${groupIdColumn}\` = $3 AND A.\`${nextItemIdColumn}\` = $4
    `,
    itemId,
    userId,
    groupId,
    itemId
  );
  // NOTE: change this to 2 from 1 when uniqueness constraint is introduced
  if (updated !== 1) {
    // the specified record does not exist
    throw new Error(
      `dbLinkedListRemoveTx: failed to UPDATE (table=${table}, userId=${userId}, groupId=${groupId}, itemId=${itemId}, affected=${updated})`
    );
  }

  const deleted = await txClient.$executeRawUnsafe(
    `
    DELETE
      FROM \`${table}\`
      WHERE \`${userIdColumn}\` = $1 AND \`${groupIdColumn}\` = $2 AND \`${itemIdColumn}\` = $3
    `,
    userId,
    groupId,
    itemId
  );
  if (deleted !== 1) {
    // how this happen?
    throw new Error(
      `dbLinkedListRemoveTx: failed to DELETE (table=${table}, userId=${userId}, groupId=${groupId}, itemId=${itemId}, affected=${deleted})`
    );
  }
}

/**
 * 連結リストからレコードを削除する
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemId アイテムID（例えばプレイリストならトラックID）
 */
export function dbLinkedListRemove<T extends LinkedListJunctionTable>(
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemId: string
): Promise<void> {
  return client.$transaction(
    (txClient): Promise<void> =>
      dbLinkedListRemoveTx(
        txClient,
        table,
        userId,
        groupIdColumn,
        groupId,
        itemIdColumn,
        nextItemIdColumn,
        itemId
      )
  );
}

/**
 * 連結リストから（番兵を除く）全てのレコードを削除する
 * @param txClient transactional prisma client
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param sentinelItemId 番兵のアイテムID
 */
export async function dbLinkedListRemoveAllTx<
  T extends LinkedListJunctionTable
>(
  txClient: TransactionalPrismaClient,
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  sentinelItemId: string
): Promise<void> {
  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${table}\`
      SET \`${nextItemIdColumn}\` = NULL
      WHERE \`${userIdColumn}\` = $1 AND \`${groupIdColumn}\` = $2 AND \`${itemIdColumn}\` = $3
    `,
    userId,
    groupId,
    sentinelItemId
  );
  if (updated !== 1) {
    throw new Error(
      `dbLinkedListRemoveAllTx: failed to UPDATE (table=${table}, userId=${userId}, groupId=${groupId}, sentinelItemId=${sentinelItemId}, affected=${updated})`
    );
  }

  await txClient.$executeRawUnsafe(
    `
    DELETE
      FROM \`${table}\`
      WHERE \`${userIdColumn}\` = $1 AND \`${groupIdColumn}\` = $2 AND \`${itemIdColumn}\` <> $3
    `,
    userId,
    groupId,
    sentinelItemId
  );
}

/**
 * 連結リストから（番兵を除く）全てのレコードを削除する
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param sentinelItemId 番兵のアイテムID
 */
export function dbLinkedListRemoveAll<T extends LinkedListJunctionTable>(
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  sentinelItemId: string
): Promise<void> {
  return client.$transaction(
    (txClient): Promise<void> =>
      dbLinkedListRemoveAllTx(
        txClient,
        table,
        userId,
        groupIdColumn,
        groupId,
        itemIdColumn,
        nextItemIdColumn,
        sentinelItemId
      )
  );
}

/**
 * 連結リストのレコードを他のレコードの後ろに移動する
 * @param txClient transactional prisma client
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemId アイテムID（例えばプレイリストならトラックID）
 * @param referenceItemId 参照アイテムID（このIDを持つアイテムの後ろに配置される、先頭に配置する場合は番兵のIDを指定する）
 */
export async function dbLinkedListMoveBeforeTx<
  T extends LinkedListJunctionTable
>(
  txClient: TransactionalPrismaClient,
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemId: string,
  referenceItemId: string
): Promise<void> {
  // before: p (maybe sentinel, always not NULL) -> t (itemId) -> q -> ... -> r (referenceItemId) -> y (maybe NULL)
  // after:  p (maybe sentinel, always not NULL) -> q -> ... -> r (referenceItemId) -> t (itemId) -> y (maybe NULL)

  // before: p, r -> t (itemId) -> q, y (NULL)
  // after:  p, r -> t (itemId) -> q, y (NULL)

  // r.nextItemId := itemId
  // t.nextItemId := r.nextItemId != t.itemId ? r.nextItemId : t.nextItemId
  // p.nextItemId := q.itemId (== t.nextItemId)

  if (itemId === referenceItemId) {
    throw new Error(
      `dbLinkedListMoveTx: invalid argument (table=${table}, userId=${userId}, groupId=${groupId}, itemId=${itemId}, referenceItemId=${itemId})`
    );
  }

  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${table}\` AS A
      SET \`${nextItemIdColumn}\` =
        CASE
          WHEN A.\`${itemIdColumn}\` = $1 THEN $2
          WHEN A.\`${itemIdColumn}\` = $3 THEN
            CASE R.\`${nextItemIdColumn}\`
              WHEN A.\`${itemIdColumn}\` THEN T.\`${nextItemIdColumn}\`
              ELSE R.\`${nextItemIdColumn}\`
            END
          WHEN A.\`${nextItemIdColumn}\` = $4 THEN T.\`${nextItemIdColumn}\`
          ELSE A.\`${nextItemIdColumn}\`
        END
      FROM \`${table}\` AS R, \`${table}\` AS T
      WHERE
        R.\`${itemIdColumn}\` = $5 AND R.\`${groupIdColumn}\` = A.\`${groupIdColumn}\` AND R.\`${userIdColumn}\` = A.\`${userIdColumn}\` AND
        T.\`${itemIdColumn}\` = $6 AND T.\`${groupIdColumn}\` = A.\`${groupIdColumn}\` AND T.\`${userIdColumn}\` = A.\`${userIdColumn}\` AND
        A.\`${userIdColumn}\` = $7 AND A.\`${groupIdColumn}\` = $8 AND
        (A.\`${itemIdColumn}\` = $9 OR A.\`${itemIdColumn}\` = $10 OR A.\`${nextItemIdColumn}\` = $11)
    `,
    referenceItemId, // $1
    itemId, // $2
    itemId, // $3
    itemId, // $4
    referenceItemId, // $5
    itemId, // $6
    userId, // $7
    groupId, // $8
    referenceItemId, // $9
    itemId, // $10
    itemId // $11
  );

  // updated:
  // - 0: failed (some entities are not found; i.e. `itemId` or `referenceItemId` are invalid)
  // - 2: successfully updated (order is unchanged; i.e. p == r)
  // - 3: successfully updated (order has been changed; i.e. p != r)

  if (updated === 0) {
    throw new Error(
      `dbLinkedListMoveTx: failed to UPDATE (table=${table}, userId=${userId}, groupId=${groupId}, itemId=${itemId}, referenceItemId=${itemId}, affected=${updated})`
    );
  }
}

/**
 * 連結リストのレコードを他のレコードの後ろに移動する
 * @param table junction table name
 * @param userId ユーザーID
 * @param groupIdColumn グループIDカラム（例えばプレイリストなら`'playlistId'`）
 * @param groupId グループID（例えばプレイリストならプレイリストID）
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemId アイテムID（例えばプレイリストならトラックID）
 * @param referenceItemId 参照アイテムID（このIDを持つアイテムの後ろに配置される、先頭に配置する場合は番兵のIDを指定する）
 */
export function dbLinkedListMoveBefore<T extends LinkedListJunctionTable>(
  table: Prisma.ModelName,
  userId: string,
  groupIdColumn: T[keyof T],
  groupId: string,
  itemIdColumn: T[keyof T],
  nextItemIdColumn: T[keyof T],
  itemId: string,
  referenceItemId: string
): Promise<void> {
  return client.$transaction(
    (txClient): Promise<void> =>
      dbLinkedListMoveBeforeTx(
        txClient,
        table,
        userId,
        groupIdColumn,
        groupId,
        itemIdColumn,
        nextItemIdColumn,
        itemId,
        referenceItemId
      )
  );
}
