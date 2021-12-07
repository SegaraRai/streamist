/**
 * 連結リストのレコードをソートしたものを返す
 * @note 初期ノード（つまり番兵）は除外して返される、処理時間は`O(n)`
 * @param itemIdColumn アイテムIDカラム（例えばプレイリストなら`'trackId'`）
 * @param nextItemIdColumn 次アイテムIDカラム（例えばプレイリストなら`'nextTrackId'`）
 * @param itemId アイテムID（例えばプレイリストならトラックID）
 * @param initialItemId 初期アイテムID、つまり番兵のアイテムID
 */
export function dbLinkedListSort<
  U extends string,
  V extends string,
  T extends Record<U, string> & Record<V, string | null | undefined>
>(
  items: readonly T[],
  itemIdColumn: U,
  nextItemIdColumn: V,
  initialItemId: string
): T[] {
  const itemMap = new Map<string, T>(
    items.map((item) => [item[itemIdColumn], item])
  );

  const sortedItems: T[] = [];
  let currentItem = itemMap.get(initialItemId);
  while (true) {
    if (!currentItem) {
      const strItemIds = items
        .map((item) => `${item[itemIdColumn]}>${item[nextItemIdColumn]}`)
        .join();
      throw new Error(
        `dbLinkedListSort: linked list corrupted (next node not found) (itemIds=${strItemIds})`
      );
    }

    // append item
    sortedItems.push(currentItem);

    // remove current item to prevent infinite loop
    itemMap.delete(currentItem[itemIdColumn]);

    // iterate
    const nextItemId = nextItemIdColumn;
    if (nextItemId == null) {
      break;
    }

    currentItem = itemMap.get(nextItemId);
  }

  if (itemMap.size !== 0) {
    const strItemIds = items
      .map((item) => `${item[itemIdColumn]}>${item[nextItemIdColumn]}`)
      .join();
    throw new Error(
      `dbLinkedListSort: linked list corrupted (unlinked nodes found) (itemIds=${strItemIds})`
    );
  }

  // return items without sentinel
  return sortedItems.slice(1);
}
