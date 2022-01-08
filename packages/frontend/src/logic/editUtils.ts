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

export function convertReqStr(input: string, org: string): string | undefined {
  input = input.trim();
  return input && input !== org ? input : undefined;
}

export function convertOptStr(
  input: string,
  org: string | null
): string | undefined {
  input = input.trim();
  return input && input !== (org || '') ? input : undefined;
}

export function convertOptId(
  input: string | undefined,
  org: string
): string | undefined {
  return input !== org ? input : undefined;
}

export function convertReqNum(
  input: number | undefined,
  org: number
): number | undefined {
  return input != null && input !== org ? input : undefined;
}

export function convertOptNum(
  input: number | undefined,
  org: number | null
): number | null | undefined {
  return (input ?? null) !== org ? input ?? null : undefined;
}
