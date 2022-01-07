export function emptyToNull<T>(value: string | T): string | null | T {
  return value === '' ? null : value;
}
