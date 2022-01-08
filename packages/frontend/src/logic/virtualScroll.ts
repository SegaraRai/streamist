// modified version of https://github.com/vueuse/vueuse/blob/main/packages/core/useVirtualList/index.ts (MIT License)

import type { Ref } from 'vue';

export interface UseVirtualScrollListOptions {
  itemHeight: number | ((index: number) => number);
  overscan?: number;
  containerElementRef: Readonly<Ref<HTMLElement | undefined>>;
  contentElementRef: Readonly<Ref<HTMLElement | undefined>>;
}

export type UseVirtualScrollListItem<T> = {
  data: T;
  index: number;
};

export function useVirtualScrollList<T>(
  list: Ref<T[]>,
  {
    itemHeight,
    overscan = 5,
    containerElementRef,
    contentElementRef,
  }: UseVirtualScrollListOptions
) {
  const listElementRef = ref<HTMLElement | null>();

  const size = useElementSize(containerElementRef);

  const currentList: Ref<UseVirtualScrollListItem<T>[]> = ref([]);
  const source = shallowRef(list);

  const state = ref({ start: 0, end: 10 });

  const getViewCapacity = (containerHeight: number, start: number) => {
    if (typeof itemHeight === 'number') {
      return Math.ceil(containerHeight / itemHeight);
    }

    if (containerHeight <= 0) {
      return 0;
    }

    const length = source.value.length;

    let sum = 0;
    for (let i = start; i < length; i++) {
      const height = (itemHeight as (index: number) => number)(i);
      sum += height;
      if (sum >= containerHeight) {
        return i - start;
      }
    }

    return length - start;
  };

  const getOffset = (scrollTop: number) => {
    if (typeof itemHeight === 'number') {
      return Math.floor(scrollTop / itemHeight);
    }

    if (scrollTop <= 0) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < source.value.length; i++) {
      const height = (itemHeight as (index: number) => number)(i);
      sum += height;
      if (sum >= scrollTop) {
        return i + 1;
      }
    }

    return source.value.length;
  };

  const calculateRange = () => {
    const listElement = listElementRef.value;
    const containerElement = containerElementRef.value;
    const contentElement = contentElementRef.value;

    if (!listElement || !containerElement || !contentElement) {
      return;
    }

    const listOffsetTop =
      listElement.getBoundingClientRect().top -
      contentElement.getBoundingClientRect().top;
    const listScrollTop = containerElement.scrollTop - listOffsetTop;
    const viewHeight = containerElement.clientHeight;

    const offset = getOffset(listScrollTop);
    const viewCapacity = getViewCapacity(
      viewHeight + Math.min(listScrollTop, 0),
      offset
    );

    // console.log(listOffsetTop, listScrollTop, viewHeight, offset, viewCapacity);

    const from = offset - overscan;
    const to = offset + viewCapacity + overscan;
    state.value = {
      start: Math.max(from, 0),
      end: Math.min(to, source.value.length),
    };
    currentList.value = source.value
      .slice(state.value.start, state.value.end)
      .map((ele, index) => ({
        data: ele,
        index: index + state.value.start,
      }));
  };

  watch(
    [
      size.width,
      size.height,
      list,
      containerElementRef,
      contentElementRef,
      listElementRef,
    ],
    () => {
      calculateRange();
    }
  );

  useEventListener(
    containerElementRef,
    'scroll',
    () => {
      calculateRange();
    },
    { passive: true }
  );

  const totalHeight = computed(() => {
    if (typeof itemHeight === 'number') return source.value.length * itemHeight;
    return source.value.reduce((sum, _, index) => sum + itemHeight(index), 0);
  });

  const getDistanceTop = (index: number) => {
    if (typeof itemHeight === 'number') {
      const height = index * itemHeight;
      return height;
    }
    const height = source.value
      .slice(0, index)
      .reduce((sum, _, i) => sum + itemHeight(i), 0);
    return height;
  };

  const offsetTop = computed(() => getDistanceTop(state.value.start));
  const containerStyle = computed(() => {
    return {
      height: `${totalHeight.value}px`,
      paddingTop: `${offsetTop.value}px`,
    };
  });

  return {
    list: currentList,
    containerStyle,
    listElementRef,
  };
}
