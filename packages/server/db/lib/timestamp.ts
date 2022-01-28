export type DBTimestamp = bigint;

export function dbGetTimestamp(timestamp = Date.now()): DBTimestamp {
  return BigInt(timestamp);
}
