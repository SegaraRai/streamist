import type { Ref } from 'vue';

export function createIntegerRef(
  initialValue?: number
): Ref<number | undefined> {
  const internal = ref<number | undefined>(initialValue);
  return computed({
    get: (): number | undefined => internal.value,
    set: (value: string | number | undefined): void => {
      let parsed: number | undefined;
      if (value != null && value !== '') {
        parsed =
          typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
      }
      internal.value = parsed != null && isFinite(parsed) ? parsed : undefined;
    },
  });
}

/**
 * @example
 * ```ts
 * convertReqStr('', '')       // undefined (but should not be called)
 * convertReqStr('', 'foo')    // undefined (different from convertOptStr)
 * convertReqStr('foo', 'foo') // undefined
 * convertReqStr('bar', 'foo') // 'bar'
 * ```
 */
export function convertReqStr(input: string, org: string): string | undefined {
  input = input.trim();
  return input && input !== org ? input : undefined;
}

/**
 * @example
 * ```ts
 * convertOptStr('', null)     // undefined
 * convertOptStr('', '')       // undefined (but should not be called)
 * convertOptStr('', 'foo')    // '' (different from convertReqStr)
 * convertOptStr('foo', 'foo') // undefined
 * convertOptStr('bar', 'foo') // 'bar'
 * ```
 */
export function convertOptStr(
  input: string,
  org: string | null
): string | undefined {
  input = input.trim();
  return input !== (org || '') ? input : undefined;
}

export function convertOptId(
  input: string | undefined,
  org: string
): string | undefined {
  return input !== org ? input : undefined;
}

/**
 * @example
 * ```ts
 * convertReqStr(1, 1)            // undefined
 * convertReqStr(1, 0)            // 1
 * convertReqStr(undefined, 0)    // undefined
 * ```
 */
export function convertReqNum(
  input: number | undefined,
  org: number
): number | undefined {
  return input !== org ? input : undefined;
}

/**
 * @example
 * ```ts
 * convertOptStr(1, null)         // 1
 * convertOptStr(1, 1)            // undefined
 * convertOptStr(1, 0)            // 1
 * convertOptStr(undefined, null) // undefined
 * convertOptStr(undefined, 0)    // null
 * ```
 */
export function convertOptNum(
  input: number | undefined,
  org: number | null
): number | null | undefined {
  const input2 = input ?? null;
  return input2 !== org ? input2 : undefined;
}
