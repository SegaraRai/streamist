// `encodeURIComponent` does not escape:
//   A-Z a-z 0-9 !       ' ( ) *   - .   _     ~
//
// unreserved characters of RFC 3986 are:
//   A-Z a-z 0-9                   - .   _     ~
//
// unreserved characters of RFC 5987 are:
//   A-Z a-z 0-9 ! # $ &         + - . ^ _ ` | ~

export function encodeRFC3986URIComponent(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
  ); // escape ! ' ( ) *
}

export function encodeRFC5987ValueChars(str: string): string {
  return encodeURIComponent(str)
    .replace(
      /['()*]/g,
      (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
    ) // escape ' ( ) *
    .replace(/%(2[346B]|5E|60|7C)/gi, (_str, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    ); // unescape # $ & + ^ ` |
}
