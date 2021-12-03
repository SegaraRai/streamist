export function calcDHash(pgm: string): string {
  const lines = pgm
    .trim()
    .split('\n')
    .map((str) => str.trim());

  // PGMであることを確認
  if (lines.shift() !== 'P2') {
    throw new Error('not a PGM');
  }

  // 幅と高さ取得
  const [width, height] = lines
    .shift()
    ?.split(' ')
    .map((str) => parseInt(str, 10)) || [-1, -1];
  if (width !== 9 || height !== 8) {
    throw new Error('invalid size');
  }

  // ホワイトポイントは要らないので破棄
  lines.shift();

  if (lines.length !== height) {
    throw new Error('invalid PGM format');
  }

  // dHash計算
  return lines
    .map((line) =>
      parseInt(
        line
          .split(' ')
          .map((str) => parseInt(str, 10))
          .reduce(
            (acc, value, index, array) =>
              acc + (value < array[index + 1] ? '1' : '0'),
            ''
          )
          .slice(0, 8),
        2
      )
        .toString(16)
        .padStart(2, '0')
    )
    .join('');
}
