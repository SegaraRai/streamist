import type { Ref } from 'vue';
import { currentScrollRef } from '~/stores/scroll';
import {
  calcMenuPositionByElement,
  calcMenuPositionByEvent,
} from './menuPosition';

export interface UseMenuOptions {
  scrollRef$$q?: Readonly<Ref<number>>;
  onClose$$q?: () => void;
}

export function useMenu({ scrollRef$$q, onClose$$q }: UseMenuOptions = {}) {
  const scrollRef = scrollRef$$q || currentScrollRef;

  const isOpen$$q = ref(false);
  const x$$q = ref(0);
  const yOffset$$q = ref(0);
  const y$$q = computed((): number => yOffset$$q.value - scrollRef.value);

  return {
    isOpen$$q: isOpen$$q as Readonly<Ref<boolean>>,
    x$$q: x$$q as Readonly<Ref<number>>,
    y$$q: y$$q as Readonly<Ref<number>>,
    open$$q: (
      eventOrElement: MouseEvent | HTMLElement,
      initCallback?: () => void
    ): void => {
      const [x, y] =
        eventOrElement instanceof MouseEvent
          ? calcMenuPositionByEvent(eventOrElement)
          : calcMenuPositionByElement(eventOrElement);
      const scroll = scrollRef.value;

      isOpen$$q.value = false;

      initCallback?.();

      nextTick().then((): void => {
        x$$q.value = x;
        yOffset$$q.value = y + scroll;
        isOpen$$q.value = true;
      });
    },
    close$$q: (): void => {
      isOpen$$q.value = false;
      onClose$$q?.();
    },
  };
}
