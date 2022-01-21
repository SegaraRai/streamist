export function isPlainObject(
  value: unknown
): value is Record<string | number | symbol, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.prototype.toString.call(value) === '[object Object]';
}
