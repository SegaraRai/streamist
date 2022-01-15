<script lang="ts">
import { useVirtualScrollList } from '~/composables';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
} from '~/stores/scroll';

export default defineComponent({
  props: {
    itemWidth: {
      type: Number,
      required: true,
    },
    itemMarginWidth: {
      type: Number,
      required: true,
    },
    itemHeight: {
      type: Number,
      required: true,
    },
    itemMarginHeight: {
      type: Number,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const _listElementRef = ref<HTMLElement | null | undefined>();
    const containerWidth = useElementBounding(_listElementRef).width;

    const numColsRef = eagerComputed(() =>
      Math.floor(
        ((containerWidth.value || 0) + props.itemMarginWidth) /
          (props.itemWidth + props.itemMarginWidth)
      )
    );
    const itemHeightRef = eagerComputed(
      () => props.itemHeight + props.itemMarginHeight
    );

    const rowStyle$$q = eagerComputed(() => `height:${itemHeightRef.value}px;`);
    const cellStyle$$q = eagerComputed(
      () =>
        `width:${props.itemWidth}px;height:${itemHeightRef.value}px;padding-bottom:${props.itemMarginHeight}px;`
    );

    const rowsRef = computed(() => {
      const numCols = numColsRef.value;
      if (!numCols) {
        return [];
      }

      const rows: [any[], unknown[]][] = [];
      for (let i = 0; i < props.items.length; i += numCols) {
        rows.push([props.items.slice(i, i + numCols), []]);
      }

      if (rows.length > 0) {
        rows[rows.length - 1][1] = new Array(
          (numCols - (props.items.length % numCols)) % numCols
        ).fill(0);
      }

      return rows;
    });

    const { containerStyle, list, listElementRef } = useVirtualScrollList(
      rowsRef,
      {
        itemHeightRef,
        additionalHeight: eagerComputed(() => -props.itemMarginHeight),
        containerElementRef: currentScrollContainerRef,
        contentElementRef: currentScrollContentRef,
      }
    );

    watch(listElementRef, (listElement) => {
      _listElementRef.value = listElement;
    });

    return {
      rowStyle$$q,
      cellStyle$$q,
      containerStyle$$q: containerStyle,
      listRows$$q: list,
      listElementRef$$q: listElementRef,
      numColsRef$$q: numColsRef,
      itemHeightRef$$q: itemHeightRef,
    };
  },
});
</script>

<template>
  <div
    ref="listElementRef$$q"
    class="w-full gap-0 flex flex-col overflow-hidden"
    :style="containerStyle$$q"
  >
    <template
      v-for="{ data: items, index: _index } in listRows$$q"
      :key="_index"
    >
      <div class="flex w-full justify-between" :style="rowStyle$$q">
        <template v-for="(item, _index2) in items[0]" :key="_index2">
          <div :style="cellStyle$$q">
            <slot :data="item" :width="itemWidth"></slot>
          </div>
        </template>
        <template v-for="(_item, _index2) in items[1]" :key="_index2">
          <div :style="cellStyle$$q"></div>
        </template>
      </div>
    </template>
  </div>
</template>
