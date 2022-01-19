export function parseRedirectTo(to: unknown): string {
  if (
    typeof to !== 'string' ||
    /^[^/]|(\/|^)\.+(\/|$)|[^\w/.~?&#=-]|^\/logout([?#&]|$)/.test(to)
  ) {
    return '/';
  }
  return to;
}
