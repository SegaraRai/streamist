import type { Ref } from 'vue';

export function useRenderDelay(ms: number): Readonly<Ref<boolean>> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flag = ref(false);
  onMounted((): void => {
    timer = setTimeout((): void => {
      timer = undefined;
      requestAnimationFrame((): void => {
        flag.value = true;
      });
    }, ms);
  });
  onBeforeMount(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
  });

  return flag;
}
