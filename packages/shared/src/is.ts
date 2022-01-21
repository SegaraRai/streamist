/**
 * 引数の`T`型の`value`をそのまま返す関数 \
 * TypeScriptコンパイラに`value`が`T`型であることを指示するために用いる
 * @param value `T`型の値
 * @returns `value`
 */
export function is<T>(value: T): T {
  return value;
}
