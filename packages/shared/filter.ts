/**
 * `array`から`null`である要素を削除した新しい配列を返す \
 * 非破壊的
 * @param array 配列
 * @returns `array`から`null`を除去した配列
 */
export function filterNull<T>(
  array: readonly (T | null)[]
): Exclude<T, null>[] {
  return array.filter((value) => value !== null) as Exclude<T, null>[];
}

/**
 * `array`から`undefined`である要素を削除した新しい配列を返す \
 * 非破壊的
 * @param array 配列
 * @returns `array`から`undefined`を除去した配列
 */
export function filterUndefined<T>(
  array: readonly (T | undefined)[]
): Exclude<T, undefined>[] {
  return array.filter((value): value is T => value !== undefined) as Exclude<
    T,
    undefined
  >[];
}

/**
 * `array`からfalsyな要素を削除した新しい配列を返す \
 * 非破壊的
 * @param array 配列
 * @returns `array`からfalsyな要素を除去した配列
 */
export function filterFalsy<T>(
  array: readonly (T | null | undefined | false | 0 | '')[]
): Exclude<T, null | undefined | false | 0 | ''>[] {
  return array.filter((value): value is T => !!value) as Exclude<
    T,
    null | undefined | false | 0 | ''
  >[];
}

/**
 * `array`から`null`または`undefined`である要素を削除した新しい配列を返す \
 * 非破壊的
 * @param array 配列
 * @returns `array`から`null`と`undefined`を除去した配列
 */
export function filterNullAndUndefined<T>(
  array: readonly (T | null | undefined)[]
): Exclude<T, null | undefined>[] {
  return array.filter((value): value is T => value != null) as Exclude<
    T,
    null | undefined
  >[];
}
