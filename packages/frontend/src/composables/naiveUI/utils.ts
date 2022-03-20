import type { MenuOption } from 'naive-ui';

export function cleanupDividers(
  menuOptions: readonly MenuOption[]
): MenuOption[] {
  const filtered = menuOptions.filter(
    (option, index, arr) =>
      option.type !== 'divider' ||
      (index !== 0 && arr[index - 1].type !== 'divider')
  );
  if (filtered[filtered.length - 1]?.type === 'divider') {
    filtered.pop();
  }
  return filtered;
}
