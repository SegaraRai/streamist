/**
 * `array`をシャッフルして`array`を返す \
 * 破壊的
 * @param array 配列
 * @param rng 乱数生成器 [0, 1) の範囲
 * @returns `array`
 */
export function shuffleArray<T>(
  array: T[],
  rng: () => number = Math.random
): T[] {
  for (let i = array.length - 1; i >= 1; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
