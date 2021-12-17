<script lang="ts">
export default defineComponent({
  props: {
    max: {
      type: Number,
      default: undefined,
    },
    value: {
      type: Number,
      default: undefined,
    },
    disabled: Boolean,
  },
  emits: {
    update: (_value: number) => true,
    dragging: (_value: number | undefined) => true,
  },
  setup(props, context) {
    const valid = computed(
      () =>
        !props.disabled &&
        props.max != null &&
        props.value != null &&
        props.value >= 0 &&
        props.value <= props.max
    );

    const rate = computed(() =>
      props.max != null && props.value != null && props.max > 0
        ? props.value / props.max
        : 0
    );

    const position = computed(() =>
      valid.value && dragging.value
        ? `${100 * mousePosition.value}%`
        : `${100 * rate.value}%`
    );

    const e = ref<HTMLDivElement | undefined>();
    const dragging = ref(false);

    const { pressed } = useMousePressed();
    const { x, elementPositionX, elementWidth } = useMouseInElement(e);

    const mousePosition = computed<number>(() =>
      Math.min(
        Math.max((x.value - elementPositionX.value) / elementWidth.value, 0),
        1
      )
    );

    watch([dragging, mousePosition], ([newDragging, newPosition]) => {
      if (valid.value && newDragging && props.max != null) {
        context.emit('dragging', newPosition * props.max);
      }
    });

    watch(pressed, (newPressed, oldPressed) => {
      if (newPressed === oldPressed || newPressed || !dragging.value) {
        return;
      }

      dragging.value = false;

      if (valid.value && props.max != null) {
        context.emit('update', mousePosition.value * props.max);
      }
    });

    return {
      valid$$q: valid,
      e,
      p: position,
      dragging$$q: dragging,
      onMouseDown$$q() {
        if (!valid.value || !e.value) {
          return;
        }

        dragging.value = true;
      },
    };
  },
});
</script>

<template>
  <div
    class="py-2 cursor-pointer"
    :class="$style.container"
    @mousedown.prevent="onMouseDown$$q"
    @touchstart.prevent="onMouseDown$$q"
  >
    <div class="relative w-full h-full">
      <div ref="e" class="absolute top-0 w-full h-full flex items-center">
        <div class="w-full h-1 bg-gray-100 rounded-full"></div>
      </div>
      <div
        class="absolute top-0 h-full flex items-center"
        :class="$style.progress"
      >
        <div class="w-full h-1 bg-gray-500 rounded-full"></div>
      </div>
      <div
        v-show="valid$$q"
        class="absolute top-0 h-full flex items-center"
        :class="[dragging$$q ? '' : 'opacity-0', $style.thumb]"
      >
        <div
          class="w-3 -ml-1.5 h-3 bg-gray-200 border-1 border-gray-300 rounded-full"
        ></div>
      </div>
    </div>
  </div>
</template>

<style module>
.thumb {
  left: v-bind('p');
}

.progress {
  width: v-bind('p');
}

.container:hover .thumb {
  opacity: 1;
}
</style>
