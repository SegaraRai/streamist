// modified version of https://github.com/vueuse/vueuse/blob/main/packages/core/useVirtualList/index.ts (MIT License)

import type { Ref } from 'vue';
import { clamp } from '$shared/clamp';

export interface UseVirtualScrollListOptions {
  disabled?: Readonly<Ref<boolean>>;
  itemHeightRef?: Readonly<Ref<number | undefined>>;
  itemHeightFunc?: (index: number) => number;
  additionalHeight?: Readonly<Ref<number>>;
  overscan?: number;
  blockSize?: number;
  containerElementRef: Readonly<Ref<HTMLElement | undefined>>;
  contentElementRef: Readonly<Ref<HTMLElement | undefined>>;
}

export type UseVirtualScrollListItem<T> = {
  data: T;
  index: number;
};

export function useVirtualScrollList<T>(
  list: Readonly<Ref<T[]>>,
  {
    disabled,
    itemHeightRef,
    itemHeightFunc,
    additionalHeight,
    overscan = 5,
    blockSize = 10,
    containerElementRef,
    contentElementRef,
  }: UseVirtualScrollListOptions
) {
  const listElementRef = ref<HTMLElement | null>();

  const size = useElementSize(containerElementRef);

  const currentList: Ref<UseVirtualScrollListItem<T>[]> = ref([]);
  const shallowList = shallowRef(list);
  const source = computedEager(() =>
    disabled?.value ? [] : shallowList.value
  );

  const state = ref({ start: 0, end: 0 });

  const getViewCapacity = (containerHeight: number, start: number): number => {
    // NOTE: -0 === 0
    if (containerHeight === 0) {
      return 0;
    }

    if (containerHeight < 0) {
      return -getViewCapacity(-containerHeight, start);
    }

    if (itemHeightRef?.value) {
      return Math.ceil(containerHeight / itemHeightRef.value);
    }

    const length = source.value.length;

    let sum = 0;
    for (let i = start; i < length; i++) {
      const height = itemHeightFunc!(i);
      sum += height;
      if (sum >= containerHeight) {
        return i - start;
      }
    }

    return length - start;
  };

  const getOffset = (scrollTop: number): number => {
    if (scrollTop <= 0) {
      return 0;
    }

    if (itemHeightRef?.value) {
      return Math.floor(scrollTop / itemHeightRef.value);
    }

    let sum = 0;
    for (let i = 0; i < source.value.length; i++) {
      const height = itemHeightFunc!(i);
      sum += height;
      if (sum >= scrollTop) {
        return i + 1;
      }
    }

    return source.value.length;
  };

  const calculateRange = (forceUpdate = false): void => {
    if (disabled?.value) {
      return;
    }

    const listElement = listElementRef.value;
    const containerElement = containerElementRef.value;
    const contentElement = contentElementRef.value;

    if (!listElement || !containerElement || !contentElement) {
      console.error('some of elements are not defined', list.value);
      return;
    }

    const listOffsetTop =
      listElement.getBoundingClientRect().top -
      contentElement.getBoundingClientRect().top;
    const listScrollTop = containerElement.scrollTop - listOffsetTop;
    const viewHeight = containerElement.clientHeight;

    const offset = Math.floor(getOffset(listScrollTop) / blockSize) * blockSize;
    const viewCapacity =
      Math.ceil(
        getViewCapacity(
          Math.min(viewHeight + listScrollTop, viewHeight),
          offset
        ) / blockSize
      ) * blockSize;

    // console.log(listOffsetTop, listScrollTop, viewHeight, offset, viewCapacity);

    const from = offset - overscan;
    const to = offset + viewCapacity + overscan;

    const newStart = Math.max(from, 0);
    const newEnd = clamp(to, source.value.length);

    // console.log(viewCapacity, offset, from, to, newStart, newEnd);

    if (
      forceUpdate ||
      newStart !== state.value.start ||
      newEnd !== state.value.end
    ) {
      state.value = {
        start: newStart,
        end: newEnd,
      };

      currentList.value = source.value
        .slice(newStart, newEnd)
        .map((ele, index) => ({
          data: ele,
          index: index + newStart,
        }));
    }
  };

  watch(
    [
      size.width,
      size.height,
      containerElementRef,
      contentElementRef,
      listElementRef,
      itemHeightRef || ref(0),
    ],
    (): void => {
      calculateRange();
    }
  );

  watch(source, (): void => {
    calculateRange(true);
  });

  useEventListener(
    containerElementRef,
    'scroll',
    () => {
      calculateRange();
    },
    { passive: true }
  );

  const totalHeight = computed(() => {
    if (disabled?.value) {
      return 0;
    }
    if (itemHeightRef?.value) {
      return source.value.length * itemHeightRef.value;
    }
    return source.value.reduce(
      (sum, _, index) => sum + itemHeightFunc!(index),
      0
    );
  });

  const getDistanceTop = (index: number): number => {
    if (disabled?.value) {
      return 0;
    }
    if (itemHeightRef?.value) {
      return index * itemHeightRef.value;
    }
    return source.value
      .slice(0, index)
      .reduce((sum, _, i) => sum + itemHeightFunc!(i), 0);
  };

  const offsetTop = computed(() => getDistanceTop(state.value.start));
  const containerStyle = computed(() => {
    return {
      height: `${totalHeight.value + (additionalHeight?.value || 0)}px`,
    };
  });
  const wrapperStyle = computed(() => {
    return {
      transform: `translate3d(0,${offsetTop.value}px,0)`,
    };
  });

  return {
    list: currentList,
    containerStyle,
    wrapperStyle,
    listElementRef,
  };
}
