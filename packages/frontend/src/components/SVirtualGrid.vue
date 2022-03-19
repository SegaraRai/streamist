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
    invisible: Boolean,
  },
  setup(props) {
    const _listElementRef = ref<HTMLElement | null | undefined>();
    const containerWidth = useElementBounding(_listElementRef).width;

    const numColsRef = computedEager(() =>
      Math.floor(
        ((containerWidth.value || 0) + props.itemMarginWidth) /
          (props.itemWidth + props.itemMarginWidth)
      )
    );
    const itemHeightRef = computedEager(
      () => props.itemHeight + props.itemMarginHeight
    );

    const rowStyle$$q = computedEager(() => `height:${itemHeightRef.value}px;`);
    const cellStyle$$q = computedEager(
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

    const { containerStyle, list, listElementRef, wrapperStyle } =
      useVirtualScrollList(rowsRef, {
        itemHeightRef,
        additionalHeight: computedEager(() => -props.itemMarginHeight),
        containerElementRef: currentScrollContainerRef,
        contentElementRef: currentScrollContentRef,
      });

    watch(listElementRef, (listElement) => {
      _listElementRef.value = listElement;
    });

    return {
      rowStyle$$q,
      cellStyle$$q,
      containerStyle$$q: containerStyle,
      wrapperStyle$$q: wrapperStyle,
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
    <div :style="wrapperStyle$$q">
      <template v-if="!invisible">
        <template
          v-for="{ data: [cols, dummyCols], index: _index } in listRows$$q"
          :key="_index"
        >
          <div class="flex w-full justify-between" :style="rowStyle$$q">
            <template v-for="(item, _index2) in cols" :key="_index2">
              <div
                :_="(_index2 || undefined) && undefined"
                :style="cellStyle$$q"
              >
                <slot :data="item" :width="itemWidth"></slot>
              </div>
            </template>
            <template v-for="(_item, _index2) in dummyCols" :key="_index2">
              <div
                :_="(_item || _index2 || undefined) && undefined"
                :style="cellStyle$$q"
              ></div>
            </template>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
