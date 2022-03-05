export function encodeUTF8Base64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export function encodeUTF8Base64URL(str: string): string {
  return encodeUTF8Base64(str)
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

export function decodeUTF8Base64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export function decodeUTF8Base64URL(str: string): string {
  return decodeUTF8Base64(
    str
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(str.length + (str.length % 4), '=')
  );
}
