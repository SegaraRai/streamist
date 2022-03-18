/*
spec or method      |unreserved (untransformed) characters
--------------------|---------------------------------------------------------------
`encodeURI`         |`` A-Z a-z 0-9 ! # $ & ' ( ) * + , - . / : ; = ? @   _     ~ ``
`encodeURIComponent`|`` A-Z a-z 0-9 !       ' ( ) *     - .               _     ~ ``
RFC 3986            |`` A-Z a-z 0-9                     - .               _     ~ ``
RFC 8187 (RFC 5987) |`` A-Z a-z 0-9 ! # $ &         +   - .             ^ _ ` | ~ ``
*/

export function encodeRFC3986URIComponent(str: string): string {
  return (
    encodeURIComponent(str)
      // escape ! ' ( ) *
      .replace(
        /[!'()*]/g,
        (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
      )
  );
}

export function encodeRFC8187ValueChars(str: string): string {
  return (
    encodeURIComponent(str)
      // escape ' ( ) *
      .replace(
        /['()*]/g,
        (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
      )
      // unescape # $ & + ^ ` |
      .replace(/%(2[346B]|5E|60|7C)/gi, (_str, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
  );
}
