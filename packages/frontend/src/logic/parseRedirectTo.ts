export function parseRedirectTo(to: unknown): string {
  if (
    typeof to !== 'string' ||
    /^[^/]|(\/|^)\.+(\/|$)|[^\w/.~?&#=-]/.test(to)
  ) {
    return '/';
  }
  return to;
}
