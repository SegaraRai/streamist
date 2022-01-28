export type DBTimestamp = bigint;

export function dbGetTimestamp(timestamp = Date.now()): DBTimestamp {
  return BigInt(timestamp);
}

// BUG? `$executeRaw`, `$executeRawUnsafe`, etc. seems not to work with bigint
export function dbConvertTimestampForRaw(timestamp: DBTimestamp): number {
  return Number(timestamp);
}
