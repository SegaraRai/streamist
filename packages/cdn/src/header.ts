export function sortHeaders(
  headers: (readonly [string, string])[]
): (readonly [string, string])[] {
  return headers.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
