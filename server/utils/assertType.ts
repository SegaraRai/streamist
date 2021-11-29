// obtained from https://qiita.com/kgtkr/items/2a8290d1b1314063a524

/**
 * `A`と`B`の型が同一であれば`true`型に、そうでなければ`false`型になる型
 */
export type TypeEquals<A, B> = (<T>() => T extends A ? 1 : 2) extends <
  T
>() => T extends B ? 1 : 2
  ? true
  : false;

/**
 * `A`と`B`の型が同一であれば`false`型に、そうでなければ`true`型になる型
 */
export type TypeNotEquals<A, B> = TypeEquals<A, B> extends true ? false : true;
