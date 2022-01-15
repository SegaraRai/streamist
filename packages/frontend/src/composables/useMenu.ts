import type { Ref } from 'vue';
import {
  calcMenuPositionByElement,
  calcMenuPositionByEvent,
} from '~/logic/menuPosition';
import { currentScrollRef } from '~/stores/scroll';

export interface UseMenuOptions {
  closeOnScroll$$q?: boolean;
  scrollRef$$q?: Readonly<Ref<number>>;
  onClose$$q?: () => void;
}

export function useMenu({
  closeOnScroll$$q,
  scrollRef$$q,
  onClose$$q,
}: UseMenuOptions = {}) {
  const scrollRef = scrollRef$$q || currentScrollRef;

  const isOpen$$q = ref(false);
  const x$$q = ref(0);
  const yOffset$$q = ref(0);
  const y$$q = computed((): number => yOffset$$q.value - scrollRef.value);

  const open$$q = (
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
  };

  const close$$q = (): void => {
    isOpen$$q.value = false;
    onClose$$q?.();
  };

  if (closeOnScroll$$q) {
    watch(scrollRef, () => {
      close$$q();
    });
  }

  return {
    isOpen$$q: isOpen$$q as Readonly<Ref<boolean>>,
    x$$q: x$$q as Readonly<Ref<number>>,
    y$$q: y$$q as Readonly<Ref<number>>,
    open$$q,
    close$$q,
  };
}
