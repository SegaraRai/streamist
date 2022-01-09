import type { VNode } from 'vue';

export function nCreateDialogContentWithWarning(
  message: () => string,
  warningMessage: () => string,
  colorClass = 'text-st-error'
): () => VNode {
  const warningClass = `font-bold text-sm ${colorClass}`;
  return () => (
    <div class="flex flex-col gap-y-2">
      <div class="flex-1">{message()}</div>
      <div class={warningClass}>{warningMessage()}</div>
    </div>
  );
}
