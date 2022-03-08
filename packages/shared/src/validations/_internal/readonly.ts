export type DeepReadonly<T> = T extends Array<infer V>
  ? readonly V[]
  : T extends object
  ? { readonly [key in keyof T]: DeepReadonly<T[key]> }
  : T;
