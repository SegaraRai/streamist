export function integerOr<T>(
  str: string | null | undefined,
  fallback: T,
  min: number,
  loose = false
): number | T {
  const regex = loose ? /^-?\d+/ : /^-?\d+$/;
  if (!str || !regex.test(str)) {
    return fallback;
  }
  const value = parseInt(str, 10);
  if (!isFinite(value)) {
    return fallback;
  }
  return Math.max(value, min);
}

export function floatOr<T>(
  str: string | null | undefined,
  fallback: T,
  loose = false
): number | T {
  const regex = loose ? /^-?\d+(\.\d+)?/ : /^-?\d+(\.\d+)?$/;
  if (!str || !regex.test(str)) {
    return fallback;
  }
  const value = parseFloat(str);
  if (!isFinite(value)) {
    return fallback;
  }
  return value;
}
