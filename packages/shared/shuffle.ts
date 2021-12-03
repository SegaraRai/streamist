/**
 * `array`をシャッフルして`array`を返す \
 * 破壊的
 * @param array 配列
 * @returns `array`
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i >= 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
