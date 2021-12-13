export function dbCreatePlaceholders(
  items: readonly unknown[],
  begin: number
): string {
  return items.map((_, i) => `$${i + begin}`).join(', ');
}
