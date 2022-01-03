import type { Ref } from 'vue';
import { currentScrollRef } from '~/stores/scroll';
import {
  calcMenuPositionByElement,
  calcMenuPositionByEvent,
} from './menuPosition';

export function useMenu(onCloseCallback?: () => void) {
  const isOpen$$q = ref(false);
  const x$$q = ref(0);
  const yOffset$$q = ref(0);
  const y$$q = computed(
    (): number => yOffset$$q.value - currentScrollRef.value
  );

  return {
    isOpen$$q: isOpen$$q as Readonly<Ref<boolean>>,
    x$$q: x$$q as Readonly<Ref<number>>,
    y$$q: y$$q as Readonly<Ref<number>>,
    open$$q: (
      eventOrElement: MouseEvent | HTMLElement,
      noPrevent = false
    ): void => {
      if (!noPrevent && eventOrElement instanceof MouseEvent) {
        eventOrElement.preventDefault();
      }

      const [x, y] =
        eventOrElement instanceof MouseEvent
          ? calcMenuPositionByEvent(eventOrElement)
          : calcMenuPositionByElement(eventOrElement);
      const scroll = currentScrollRef.value;

      isOpen$$q.value = false;

      nextTick().then(() => {
        x$$q.value = x;
        yOffset$$q.value = y + scroll;
        isOpen$$q.value = true;
      });
    },
    close$$q: (): void => {
      isOpen$$q.value = false;
      onCloseCallback?.();
    },
  };
}
