/*
const code1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const code2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const reverseCode = [];
for (const [index, char] of [...code1].entries()) {
  reverseCode[char.charCodeAt(0)] = index;
}
for (const [index, char] of [...code2].entries()) {
  reverseCode[char.charCodeAt(0)] = index;
}

console.log(JSON.stringify(reverseCode).replace(/null/g, '').replace(/,/g, ', '));
*/

// prettier-ignore
/**
 * reverse base64 map \
 * `(charCode - 43) -> (index)`
 */
const reverseCode: readonly number[] = [
  // \x00 - \x2a is omitted to reduce array size
  // the first element indicates the `index` of \x2b ('+', 0x2b is 43)

  // + , - . /
  // ('+' = 62, '-' = 62, '/' = 63)
  62, 0, 62, 0, 63,
  // 0-9
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
  // : ; < = > ? @
  0, 0, 0, 0, 0, 0, 0,
  // A-Z
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  // [ \ ] ^ _ `
  // ('_' = 63)
  0, 0, 0, 0, 63, 0,
  // a-z
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
];

/**
 * decodes base64 or base64URL string to `Uint8Array` \
 * no exception will be thrown (unless `base64` is not a string) \
 * Even if the input is malformed, a `Uint8Array` is returned, but its content will be undefined
 * @param base64 base64 or base64URL string
 * @returns decoded data
 */
export function decodeBase64(base64: string): Uint8Array {
  // obtained from https://github.com/niklasvh/base64-arraybuffer/blob/master/lib/base64-arraybuffer.js
  // MIT LICENSE

  base64 = base64.replace(/=/g, '');

  const base64Length = base64.length;
  const bufferLength = Math.floor(base64Length * 0.75 + 0.1);
  const buffer = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < base64Length; i += 4) {
    // NOTE: both `array[-1]` and `array[array.length]` evaluate to `undefined`
    //       `undefined << n`, `undefined >> n` and `undefined & n` evaluate to `0`, not `NaN`
    //       also it's rare that any of `v1`, `v2`, `v3` and `v4` become `undefined`

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const v1 = reverseCode[base64.charCodeAt(i) - 43]!;
    const v2 = reverseCode[base64.charCodeAt(i + 1) - 43]!;
    const v3 = reverseCode[base64.charCodeAt(i + 2) - 43]!;
    const v4 = reverseCode[base64.charCodeAt(i + 3) - 43]!;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    // NOTE: out-of-range access of `Uint8Array` causes nothing
    //       that is, no exception will be thrown, and values and the length of the array will not change
    buffer[p++] = (v1 << 2) | (v2 >> 4);
    buffer[p++] = ((v2 << 4) | (v3 >> 2)) & 255;
    buffer[p++] = ((v3 << 6) | v4) & 255;
  }

  return buffer;
}
