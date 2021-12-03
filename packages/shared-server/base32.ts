const code = '0123456789abcdefghijklmnopqrstuv';

/**
 * 指定された`Buffer`を小文字のBase32でエンコードした結果を返す \
 * 使用する文字は'0123456789abcdefghijklmnopqrstuv' \
 * ビット列が不足する分は末尾に0を補完してエンコードする
 * @param buffer `Buffer`
 * @returns base32 encoded string
 * @example
 * encodeBase32(Buffer.from('0000000000', 'hex'));  // '00000000'
 * encodeBase32(Buffer.from('ffffffffff', 'hex'));  // 'vvvvvvvv'
 * encodeBase32(Buffer.from('', 'utf-8'));          // ''
 * encodeBase32(Buffer.from('a', 'utf-8'));         // 'c4'
 * encodeBase32(Buffer.from('ab', 'utf-8'));        // 'c5h0'
 */
export function encodeBase32(buffer: Buffer): string {
  let result = '';

  let value = 0;
  let bitCount = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer.readUInt8(i);
    bitCount += 8;

    do {
      bitCount -= 5;
      result += code[value >> bitCount];
      // strip processed bits
      value &= (1 << bitCount) - 1;
    } while (bitCount >= 5);
  }

  if (bitCount > 0) {
    result += code[value << (5 - bitCount)];
  }

  return result;
}
