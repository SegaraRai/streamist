export const createInSerializer = <T extends string>(
  values: readonly T[],
  defaultValue: T
) => {
  const valueSet: ReadonlySet<string> = new Set(values);
  return {
    read: (str: string | null | undefined): T => {
      return str != null && valueSet.has(str) ? (str as T) : defaultValue;
    },
    write: (str: T): string => {
      return valueSet.has(str) ? str : defaultValue;
    },
  };
};
