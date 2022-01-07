<script lang="ts">
import type { PropType } from 'vue';
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
    const tentative$$q = eagerComputed(() => !!tentativeItems$$q.value);
    const items$$q = eagerComputed(
      () => tentativeItems$$q.value || props.items
    );

    const onChange$$q = (event: VueDraggableChangeEvent<any>) => {
      if (props.onMove) {
        const { items, onMove } = props;

        const { moved } = event;
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
      items$$q,
      tentative$$q,
      onChange$$q,
    };
  },
});
</script>

<template>
  <g-draggable
    :model-value="items$$q"
    :item-key="itemKey"
    :disabled="disabled || tentative$$q"
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
  </g-draggable>
</template>
