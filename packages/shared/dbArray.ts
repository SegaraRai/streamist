// とりあえずsharedに置いているが、ソートは全てサーバー側で予め行い、クライアント側では行わないようにする予定

const ARRAY_ITEM_PREFIX = '<' as const;
const ARRAY_ITEM_SUFFIX = '>' as const;

const ARRAY_ITEMS_DELIMITER =
  `${ARRAY_ITEM_SUFFIX}${ARRAY_ITEM_PREFIX}` as const;
const ARRAY_ITEMS_SUBSTR_START = ARRAY_ITEM_PREFIX.length;
const ARRAY_ITEMS_SUBSTR_END = ARRAY_ITEM_SUFFIX.length;

export function dbArraySerializeItemIds(itemIds: readonly string[]): string {
  if (itemIds.length === 0) {
    return '';
  }
  return itemIds
    .map((itemId) => `${ARRAY_ITEM_PREFIX}${itemId}${ARRAY_ITEM_SUFFIX}`)
    .join('');
}

export function dbArrayDeserializeItemIds(dbItemIds: string): string[] {
  if (!dbItemIds) {
    return [];
  }
  return dbItemIds
    .slice(ARRAY_ITEMS_SUBSTR_START, -ARRAY_ITEMS_SUBSTR_END)
    .split(ARRAY_ITEMS_DELIMITER);
}

export function dbArraySort<T extends { id: string }>(
  items: T[],
  itemOrder: string
): T[] {
  const itemIds = dbArrayDeserializeItemIds(itemOrder);
  const itemIdToIndexMap = new Map<string, number>(
    itemIds.map((id, index) => [id, index])
  );
  const fallbackIndex = itemIds.length;
  items.sort(
    (a, b) =>
      (itemIdToIndexMap.get(a.id) ?? fallbackIndex) -
      (itemIdToIndexMap.get(b.id) ?? fallbackIndex)
  );
  return items;
}
