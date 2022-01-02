import {
  dbArrayDeserializeItemIds,
  dbArraySerializeItemIds,
} from '$shared/dbArray';
import type { Prisma, PrismaClient } from '$prisma/client';
import { HTTPError } from '$/utils/httpError';
import { client } from './client';
import { dbCreatePlaceholders } from './placeholder';
import type { TransactionalPrismaClient } from './types';

/**
 * IDが重複している、DBに存在しない、所定のユーザーのものではない、等
 */
export class DBArrayInvalidArgumentError extends HTTPError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = 'DBArrayInvalidArgumentError';
  }
}

/**
 * 楽観ロックで中止した場合
 */
export class DBArrayOptimisticLockAbortError extends HTTPError {
  constructor(message: string) {
    super(409, message);
    this.name = 'DBArrayOptimisticLockAbortError';
  }
}

const idColumn = 'id' as const;
const userIdColumn = 'userId' as const;
const updatedAtColumn = 'updatedAt' as const;

interface ArrayMainTable {
  [idColumn]: typeof idColumn;
  [userIdColumn]: typeof userIdColumn;
  [updatedAtColumn]: typeof updatedAtColumn;
}

function isSameItems(a: readonly string[], b: readonly string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  return (
    a.length === b.length &&
    setA.size === a.length &&
    setB.size === b.length &&
    // TODO(ESNext): calc intersection or union
    b.every((item) => setA.has(item))
  );
}

function getManyToManyTableInfo(
  table1: Prisma.ModelName,
  table2: Prisma.ModelName
) {
  const isTable1Primary = table1 <= table2;
  const jtPrimaryTable = isTable1Primary ? table1 : table2;
  const jtSecondaryTable = isTable1Primary ? table2 : table1;
  const junctionTable = `_${jtPrimaryTable}To${jtSecondaryTable}` as const;
  const jtTable1Column = isTable1Primary ? ('A' as const) : ('B' as const);
  const jtTable2Column = isTable1Primary ? ('B' as const) : ('A' as const);
  return {
    junctionTable,
    jtTable1Column,
    jtTable2Column,
  };
}

/**
 * 配列に新規レコードを作成する（多分アトミック）
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param itemIds 追加するアイテムID（例えばプレイリストならトラックID）
 * @param prepend trueなら先頭に追加する
 */
export async function dbArrayAddTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  itemIds: string | readonly string[],
  prepend = false
): Promise<void> {
  if (typeof itemIds === 'string') {
    itemIds = [itemIds];
  }

  if (itemIds.length === 0) {
    return;
  }

  // check if itemIds has no duplications
  if (new Set(itemIds).size !== itemIds.length) {
    throw new DBArrayInvalidArgumentError(
      400,
      `dbArrayAppendTx: itemIds has duplication (for ${mainTable}, userId: ${userId}, groupId: ${groupId}, itemIds: ${itemIds})`
    );
  }

  // get the junction table info
  const {
    junctionTable,
    jtTable1Column: jtMainTableColumn,
    jtTable2Column: jtItemTableColumn,
  } = getManyToManyTableInfo(mainTable, itemTable);

  // insert pairs into the junction table
  // NOTE: すでに存在するペアはここでユニーク制約によって弾かれる
  // NOTE(security): ここでitemIdsのユーザーIDを確認している
  // 本当はitemTableもArrayMainTable型であることを確認したい
  const inserted = await txClient.$executeRawUnsafe(
    `
    INSERT INTO \`${junctionTable}\` (\`${jtMainTableColumn}\`, \`${jtItemTableColumn}\`)
    SELECT $1, \`${idColumn}\`
      FROM \`${itemTable}\`
      WHERE \`${userIdColumn}\` = $2 AND \`${idColumn}\` IN (${dbCreatePlaceholders(
      itemIds,
      3
    )})
    `,
    groupId,
    userId,
    ...itemIds
  );
  if (inserted !== itemIds.length) {
    throw new DBArrayInvalidArgumentError(
      404,
      `dbArrayAppendTx: failed to INSERT some rows (at ${junctionTable}, userId: ${userId}, groupId: ${groupId}, expected: ${itemIds.length}, actual: ${inserted}, itemIds: ${itemIds})`
    );
  }

  // update the order column of the items
  // NOTE(security): ここでgroupIdのユーザーIDを確認している
  // NOTE: CONCAT is not supported by SQLite
  const expression = prepend
    ? `($1 || \`${itemOrderColumn}\`)`
    : `(\`${itemOrderColumn}\` || $1)`;
  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${mainTable}\`
      SET \`${itemOrderColumn}\` = ${expression}, \`${updatedAtColumn}\` = $2
      WHERE \`${userIdColumn}\` = $3 AND \`${idColumn}\` = $4
    `,
    dbArraySerializeItemIds(itemIds),
    Date.now(),
    userId,
    groupId
  );
  if (updated !== 1) {
    // should not occur if the groupId and userId are both correct
    throw new DBArrayInvalidArgumentError(
      404,
      `dbArrayAppendTx: failed to UPDATE order column (at ${mainTable}.${itemOrderColumn}, userId: ${userId}, groupId: ${groupId}, itemIds: ${itemIds})`
    );
  }
}

/**
 * 配列に新規レコードを作成する（多分アトミック）
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param itemIds 追加するアイテムID（例えばプレイリストならトラックID）
 * @param prepend trueなら先頭に追加する
 */
export function dbArrayAdd<T extends ArrayMainTable>(
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  itemIds: string | readonly string[],
  prepend = false
): Promise<void> {
  return client.$transaction((txClient) =>
    dbArrayAddTx(
      txClient,
      userId,
      mainTable,
      itemTable,
      itemOrderColumn,
      groupId,
      itemIds,
      prepend
    )
  );
}

/**
 * コールバックを指定して配列からレコードを削除する（楽観ロック）
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param callback コールバック（`true`を返すと削除）
 */
async function dbArrayRemoveByCallbackTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  callback: (itemId: string) => boolean
): Promise<void> {
  // get the junction table info
  const {
    junctionTable,
    jtTable1Column: jtMainTableColumn,
    jtTable2Column: jtItemTableColumn,
  } = getManyToManyTableInfo(mainTable, itemTable);

  // retrieve current item order
  // NOTE(security): ここでgroupIdのユーザーIDを確認している
  const main = await txClient.$queryRawUnsafe<Record<string, string>[]>(
    `
    SELECT \`${itemOrderColumn}\`
      FROM \`${mainTable}\`
      WHERE \`${userIdColumn}\` = ? AND \`${idColumn}\` = ?
    `,
    userId,
    groupId
  );
  if (main.length !== 1) {
    throw new DBArrayInvalidArgumentError(
      404,
      `dbArrayRemoveByCallbackTx: main record not found (at ${mainTable}, userId: ${userId}, groupId: ${groupId})`
    );
  }

  const oldItemOrder = main[0][itemOrderColumn as unknown as string];
  const oldItemIds = dbArrayDeserializeItemIds(oldItemOrder);

  // create new item order
  const removeItemIds: string[] = [];
  const newItemIds = oldItemIds.filter((itemId) => {
    const remove = callback(itemId);
    if (remove) {
      removeItemIds.push(itemId);
    }
    return !remove;
  });
  const newItemOrder = dbArraySerializeItemIds(newItemIds);

  if (removeItemIds.length === 0) {
    return;
  }

  // NOTE(security): 削除時はアイテムのユーザーIDの確認は不要
  const deleted = await txClient.$executeRawUnsafe(
    `
    DELETE
      FROM \`${junctionTable}\`
      WHERE \`${jtMainTableColumn}\` = $1 AND \`${jtItemTableColumn}\` IN (${dbCreatePlaceholders(
      removeItemIds,
      2
    )})
    `,
    groupId,
    ...removeItemIds
  );
  if (deleted !== removeItemIds.length) {
    throw new DBArrayInvalidArgumentError(
      404,
      `dbArrayRemoveByCallbackTx: failed to DELETE some rows (at ${junctionTable}, userId: ${userId}, groupId: ${groupId}, removeItemIds: ${removeItemIds})`
    );
  }

  // update item order (optimistic lock pattern)
  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${mainTable}\`
      SET \`${itemOrderColumn}\` = $1, \`${updatedAtColumn}\` = $2
      WHERE \`${userIdColumn}\` = $3 AND \`${idColumn}\` = $4 AND \`${itemOrderColumn}\` = $5
    `,
    newItemOrder,
    Date.now(),
    userId,
    groupId,
    oldItemOrder
  );
  if (updated !== 1) {
    // optimistic lock failure
    throw new DBArrayOptimisticLockAbortError(
      `dbArrayRemoveByCallbackTx: failed to UPDATE order column (at ${mainTable}.${itemOrderColumn}, userId: ${userId}, groupId: ${groupId})`
    );
  }
}

/**
 * IDを指定して配列からレコードを削除する（楽観ロック）
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param itemIds 削除するアイテムID（例えばプレイリストならトラックID）
 */
function dbArrayRemoveByIdsTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  itemIds: string | readonly string[]
): Promise<void> {
  if (typeof itemIds === 'string') {
    itemIds = [itemIds];
  }

  if (itemIds.length === 0) {
    return Promise.resolve();
  }

  const itemIdSet = new Set(itemIds);

  // currently we don't throw error if the itemIds contains duplicated itemIds or invalid itemIds
  return dbArrayRemoveByCallbackTx(
    txClient,
    userId,
    mainTable,
    itemTable,
    itemOrderColumn,
    groupId,
    (itemId) => itemIdSet.has(itemId)
  );
}

/**
 * 配列からレコードを削除する（楽観ロック）
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param target 削除するアイテムID（例えばプレイリストならトラックID）またはコールバック（`true`を返すと削除）
 */
export function dbArrayRemoveTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  target: string | readonly string[] | ((itemId: string) => boolean)
): Promise<void> {
  return typeof target === 'function'
    ? dbArrayRemoveByCallbackTx(
        txClient,
        userId,
        mainTable,
        itemTable,
        itemOrderColumn,
        groupId,
        target
      )
    : dbArrayRemoveByIdsTx(
        txClient,
        userId,
        mainTable,
        itemTable,
        itemOrderColumn,
        groupId,
        target
      );
}

/**
 * 配列からレコードを削除する（楽観ロック）
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param target 削除するアイテムID（例えばプレイリストならトラックID）またはコールバック（`true`を返すと削除）
 */
export function dbArrayRemove<T extends ArrayMainTable>(
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  target: string | readonly string[] | ((itemId: string) => boolean)
): Promise<void> {
  return client.$transaction((txClient) =>
    dbArrayRemoveTx(
      txClient,
      userId,
      mainTable,
      itemTable,
      itemOrderColumn,
      groupId,
      target
    )
  );
}

/**
 * 配列から全てのレコードを削除する（楽観ロック）
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 */
export function dbArrayRemoveAllTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string
): Promise<void> {
  return dbArrayRemoveByCallbackTx(
    txClient,
    userId,
    mainTable,
    itemTable,
    itemOrderColumn,
    groupId,
    () => true
  );
}

/**
 * 配列から全てのレコードを削除する（楽観ロック）
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 */
export function dbArrayRemoveAll<T extends ArrayMainTable>(
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string
): Promise<void> {
  return client.$transaction((txClient) =>
    dbArrayRemoveAllTx(
      txClient,
      userId,
      mainTable,
      itemTable,
      itemOrderColumn,
      groupId
    )
  );
}

/**
 * 配列のレコードを並び替える（楽観ロック、トランザクション不要）
 * @param txClient (transactional) prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param callback 並び替えを行う関数
 */
export async function dbArrayReorderTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient | PrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  callback: (itemIds: string[]) => string[]
): Promise<void> {
  // retrieve current item order
  // NOTE(security): ここでgroupIdのユーザーIDを確認している
  const main = await txClient.$queryRawUnsafe<Record<string, string>[]>(
    `
    SELECT \`${itemOrderColumn}\`
      FROM \`${mainTable}\`
      WHERE \`${userIdColumn}\` = ? AND \`${idColumn}\` = ?
    `,
    userId,
    groupId
  );
  if (main.length !== 1) {
    throw new DBArrayInvalidArgumentError(
      404,
      `dbArrayReorderTx: main record not found (at ${mainTable}, userId: ${userId}, groupId: ${groupId})`
    );
  }

  const oldItemOrder = main[0][itemOrderColumn as unknown as string];
  const oldItemIds = dbArrayDeserializeItemIds(oldItemOrder);

  // create new item order
  // though we can handle async callback, we don't allow it to avoid long transactions
  const newItemIds = callback(oldItemIds);
  if (!isSameItems(oldItemIds, newItemIds)) {
    // status should be 500 if newItemIds is produced by the server and 400 if newItemIds is produced by the client
    throw new DBArrayInvalidArgumentError(
      500,
      `dbArrayReorderTx: invalid itemIds returned by callback (at ${mainTable}, userId: ${userId}, groupId: ${groupId}, newItemIds: ${newItemIds}, oldItemIds: ${oldItemIds})`
    );
  }
  const newItemOrder = dbArraySerializeItemIds(newItemIds);

  // update item order (optimistic lock pattern)
  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${mainTable}\`
      SET \`${itemOrderColumn}\` = $1, \`${updatedAtColumn}\` = $2
      WHERE \`${userIdColumn}\` = $3 AND \`${idColumn}\` = $4 AND \`${itemOrderColumn}\` = $5
    `,
    newItemOrder,
    Date.now(),
    userId,
    groupId,
    oldItemOrder
  );
  if (updated !== 1) {
    // optimistic lock failure
    throw new DBArrayOptimisticLockAbortError(
      `dbArrayReorderTx: failed to UPDATE order column (at ${mainTable}.${itemOrderColumn}, userId: ${userId}, groupId: ${groupId})`
    );
  }
}

/**
 * 配列のレコードを並び替える
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param groupId `mainTable`の対象行のID（例えばプレイリストならプレイリストID）
 * @param callback 並び替えを行う関数
 */
export function dbArrayReorder<T extends ArrayMainTable>(
  userId: string,
  mainTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  groupId: string,
  callback: (itemIds: string[]) => string[]
): Promise<void> {
  return dbArrayReorderTx(
    client,
    userId,
    mainTable,
    itemOrderColumn,
    groupId,
    callback
  );
}

/**
 * 配列のレコードを指定したレコードの前に移動するコールバックを作成する
 * @param targetItemId 対象のレコードのID
 * @param referenceItemId 参照するレコードのID（これの前に配置する）、`null`の場合は末尾に配置する
 */
export function dbArrayCreateMoveBeforeReorderCallback(
  targetItemId: string,
  referenceItemId: string | null
): (itemIds: readonly string[]) => string[] {
  if (targetItemId === referenceItemId) {
    // status should be 500 if arguments are specified by the server and 400 if arguments are specified by the client
    throw new DBArrayInvalidArgumentError(
      400,
      `dbArrayCreateMoveBeforeReorderCallback: targetItemId is referenceItemId (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId})`
    );
  }

  return (itemIds: readonly string[]): string[] => {
    const newItemIds = [...itemIds];

    const targetIndex = newItemIds.indexOf(targetItemId);
    if (targetIndex < 0) {
      // status should be 500 if targetItemId is specified by the server and 404 if targetItemId is specified by the client
      throw new DBArrayInvalidArgumentError(
        404,
        `dbArrayCreateMoveBeforeReorderCallback: target item not found (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId}, itemIds: ${itemIds})`
      );
    }

    newItemIds.splice(targetIndex, 1);

    const referenceIndex =
      referenceItemId == null
        ? newItemIds.length
        : newItemIds.indexOf(referenceItemId);
    if (referenceIndex < 0) {
      // status should be 500 if targetItemId is specified by the server and 400 if targetItemId is specified by the client
      throw new DBArrayInvalidArgumentError(
        400,
        `dbArrayCreateMoveBeforeReorderCallback: reference item not found (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId}, itemIds: ${itemIds})`
      );
    }

    newItemIds.splice(referenceIndex, 0, targetItemId);

    return newItemIds;
  };
}

/**
 * 配列のレコードを指定したレコードの後に移動するコールバックを作成する
 * @param targetItemId 対象のレコードのID
 * @param referenceItemId 参照するレコードのID（これの後に配置する）、`null`の場合は先頭に配置する
 */
export function dbArrayCreateMoveAfterReorderCallback(
  targetItemId: string,
  referenceItemId: string | null
): (itemIds: readonly string[]) => string[] {
  if (targetItemId === referenceItemId) {
    // status should be 500 if arguments are specified by the server and 400 if arguments are specified by the client
    throw new DBArrayInvalidArgumentError(
      400,
      `dbArrayCreateMoveAfterReorderCallback: targetItemId is referenceItemId (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId})`
    );
  }

  return (itemIds: readonly string[]): string[] => {
    const newItemIds = [...itemIds];

    const targetIndex = newItemIds.indexOf(targetItemId);
    if (targetIndex < 0) {
      // status should be 500 if targetItemId is specified by the server and 404 if targetItemId is specified by the client
      throw new DBArrayInvalidArgumentError(
        404,
        `dbArrayCreateMoveAfterReorderCallback: target item not found (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId}, itemIds: ${itemIds})`
      );
    }

    newItemIds.splice(targetIndex, 1);

    const referenceIndex =
      referenceItemId == null ? -1 : newItemIds.indexOf(referenceItemId);
    if (referenceItemId != null && referenceIndex < 0) {
      // status should be 500 if targetItemId is specified by the server and 400 if targetItemId is specified by the client
      throw new DBArrayInvalidArgumentError(
        400,
        `dbArrayCreateMoveAfterReorderCallback: reference item not found (targetItemId: ${targetItemId}, referenceItemId: ${referenceItemId}, itemIds: ${itemIds})`
      );
    }

    newItemIds.splice(referenceIndex + 1, 0, targetItemId);

    return newItemIds;
  };
}

/**
 * あるレコードをすべての配列から削除する（アトミック） \
 * ジャンクションテーブルも操作する \
 * これ自体はアトミックだが、使用者はこの処理以降に新たに作成される場合に備えておく必要がある
 * @param txClient transactional prisma client
 * @param userId ユーザーID
 * @param mainTable 主となるテーブル（配列を持つ）
 * @param itemTable 配列の要素となるテーブル
 * @param itemOrderColumn 配列の順序を保持するカラム
 * @param itemId 削除するアイテムID（例えばプレイリストならトラックID）
 */
export async function dbArrayRemoveFromAllTx<T extends ArrayMainTable>(
  txClient: TransactionalPrismaClient,
  userId: string,
  mainTable: Prisma.ModelName,
  itemTable: Prisma.ModelName,
  itemOrderColumn: T[keyof T],
  itemId: string
): Promise<void> {
  if (/[%_]/.test(itemId)) {
    return;
  }

  const itemIdBlock = dbArraySerializeItemIds([itemId]);
  const searchQuery = `%${itemIdBlock}%`;

  // get the junction table info
  const {
    junctionTable,
    jtTable1Column: jtMainTableColumn,
    jtTable2Column: jtItemTableColumn,
  } = getManyToManyTableInfo(mainTable, itemTable);

  const groupIds = (
    await txClient.$queryRawUnsafe<
      { readonly A: string; readonly B: string }[]
    >(
      `
      SELECT \`${jtMainTableColumn}\`
        FROM \`${junctionTable}\`
        WHERE \`${jtItemTableColumn}\` = $1
      `,
      itemId
    )
  ).map((junctionRow): string => junctionRow[jtMainTableColumn]);

  const deleted = await txClient.$executeRawUnsafe(
    `
    DELETE
      FROM \`${junctionTable}\`
      WHERE \`${jtItemTableColumn}\` = $1 AND \`${jtMainTableColumn}\` IN (${dbCreatePlaceholders(
      groupIds,
      2
    )})
    `,
    itemId,
    ...groupIds
  );
  if (deleted !== groupIds.length) {
    throw new DBArrayOptimisticLockAbortError(
      `dbArrayRemoveFromAllTx: failed to DELETE some rows (at ${junctionTable}, userId: ${userId}, itemId: ${itemId}, groupIds: ${groupIds})`
    );
  }

  const updated = await txClient.$executeRawUnsafe(
    `
    UPDATE \`${mainTable}\`
      SET \`${itemOrderColumn}\` = REPLACE(\`${itemOrderColumn}\`, $1, ''), \`${updatedAtColumn}\` = $2
      WHERE \`${userIdColumn}\` = $3 AND \`${itemOrderColumn}\` LIKE $4 AND \`${idColumn}\` IN (${dbCreatePlaceholders(
      groupIds,
      5
    )})
    `,
    itemIdBlock,
    Date.now(),
    userId,
    searchQuery,
    ...groupIds
  );
  if (updated !== groupIds.length) {
    throw new DBArrayOptimisticLockAbortError(
      `dbArrayRemoveFromAllTx: failed to UPDATE some rows (at ${junctionTable}, userId: ${userId}, itemId: ${itemId}, groupIds: ${groupIds})`
    );
  }
}
