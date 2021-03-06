<script lang="ts">
import type { PropType } from 'vue';
import { DRAG_DELAY_FOR_TOUCH } from '~/config';
import type { VueDraggableChangeEvent } from '~/logic/draggable/types';

function wrapPromise<T>(func: () => T | PromiseLike<T>): Promise<T> {
  try {
    return Promise.resolve(func());
  } catch (e) {
    return Promise.reject(e);
  }
}

export default defineComponent({
  props: {
    itemKey: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    onMove: {
      type: Function as PropType<
        (item: any, nextItem: any) => void | Promise<void>
      >,
      default: undefined,
    },
    disabled: Boolean,
  },
  emits: {
    start: () => true,
    end: () => true,
  },
  setup(props) {
    const tentativeItems$$q = shallowRef<any[] | undefined>();
    const tentative$$q = computedEager(() => !!tentativeItems$$q.value);
    const items$$q = computedEager(
      () => tentativeItems$$q.value || props.items
    );

    const onChange$$q = (event: unknown) => {
      if (props.onMove) {
        const { items, onMove } = props;

        const { moved } = event as VueDraggableChangeEvent<any>;
        if (!moved) {
          return;
        }

        const { newIndex, oldIndex, element: item } = moved;
        if (newIndex === oldIndex) {
          return;
        }

        const nextItemIndex = newIndex + (newIndex > oldIndex ? 1 : 0);
        const nextItem = items[nextItemIndex] as any | undefined;

        const tempItems = items.slice();
        tempItems.splice(oldIndex, 1);
        tempItems.splice(newIndex, 0, item);
        tentativeItems$$q.value = tempItems;

        wrapPromise(() => onMove(item, nextItem)).finally(() => {
          tentativeItems$$q.value = undefined;
        });
      }
    };

    return {
      delay$$q: DRAG_DELAY_FOR_TOUCH,
      items$$q,
      tentative$$q,
      onChange$$q,
    };
  },
});
</script>

<template>
  <VueDraggable
    :model-value="items$$q"
    :item-key="itemKey"
    :disabled="disabled || tentative$$q"
    :delay="delay$$q"
    :delay-on-touch-only="true"
    @change="onChange$$q"
  >
    <!-- https://github.com/SortableJS/vue.draggable.next/issues/111 -->
    <template #item="{ element }">
      <div>
        <slot name="item" :element="element"></slot>
      </div>
    </template>
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </VueDraggable>
</template>
