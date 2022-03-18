/*
spec or method      |unreserved (untransformed) characters
--------------------|---------------------------------------------------------------
`encodeURI`         |`` A-Z a-z 0-9 ! # $ & ' ( ) * + , - . / : ; = ? @   _     ~ ``
`encodeURIComponent`|`` A-Z a-z 0-9 !       ' ( ) *     - .               _     ~ ``
RFC 3986            |`` A-Z a-z 0-9                     - .               _     ~ ``
RFC 8187 (RFC 5987) |`` A-Z a-z 0-9 ! # $ &         +   - .             ^ _ ` | ~ ``
*/

const escapeMap: Readonly<Record<string, string>> = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
};

const unescapeMap: Readonly<Record<string, string>> = {
  '%23': '#',
  '%24': '$',
  '%26': '&',
  '%2B': '+',
  '%2b': '+',
  '%5E': '^',
  '%5e': '^',
  '%60': '`',
  '%7C': '|',
  '%7c': '|',
};

export function encodeRFC3986URIComponent(str: string): string {
  return (
    encodeURIComponent(str)
      // escape ! ' ( ) *
      .replace(/[!'()*]/g, (c) => escapeMap[c])
  );
}

export function encodeRFC8187ValueChars(str: string): string {
  return (
    encodeURIComponent(str)
      // escape ' ( ) *
      .replace(/['()*]/g, (c) => escapeMap[c])
      // unescape # $ & + ^ ` |
      .replace(/%(?:2[346B]|5E|60|7C)/gi, (s) => unescapeMap[s])
  );
}
