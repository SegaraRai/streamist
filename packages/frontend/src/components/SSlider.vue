<script lang="ts">
import { clamp } from '$shared/clamp';

export default defineComponent({
  props: {
    max: {
      type: Number,
      default: undefined,
    },
    modelValue: {
      type: Number,
      default: undefined,
    },
    wheelDelta: {
      type: Number,
      default: undefined,
    },
    disabled: Boolean,
  },
  emits: {
    'update:modelValue': (_value: number) => true,
    dragging: (_value: number | undefined) => true,
  },
  setup(props, { emit }) {
    const valid = computed(
      () =>
        !props.disabled &&
        props.max != null &&
        props.modelValue != null &&
        props.modelValue >= 0 &&
        props.modelValue <= props.max
    );

    const rate = computed(() =>
      props.max != null && props.modelValue != null && props.max > 0
        ? clamp(props.modelValue / props.max)
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
      clamp((x.value - elementPositionX.value) / elementWidth.value)
    );

    watch([dragging, mousePosition], ([newDragging, newPosition]) => {
      if (valid.value && newDragging && props.max != null) {
        emit('dragging', newPosition * props.max);
      }
    });

    watch(pressed, (newPressed, oldPressed) => {
      if (newPressed === oldPressed || newPressed || !dragging.value) {
        return;
      }

      dragging.value = false;

      if (valid.value && props.max != null) {
        emit('update:modelValue', mousePosition.value * props.max);
      }
    });

    return {
      valid$$q: valid,
      e,
      p: position,
      dragging$$q: dragging,
      onMouseDown$$q(event?: MouseEvent) {
        if (!valid.value || !e.value) {
          return;
        }

        if (event && event.button !== 0) {
          return;
        }

        dragging.value = true;
      },
      onWheel$$q(event: WheelEvent) {
        if (
          !props.wheelDelta ||
          !valid.value ||
          !e.value ||
          props.modelValue == null ||
          props.max == null
        ) {
          return;
        }

        const rawDelta = -event.deltaY || event.deltaX;
        if (!rawDelta) {
          return;
        }

        const delta = (rawDelta > 0 ? 1 : -1) * props.wheelDelta;
        emit('update:modelValue', clamp(props.modelValue + delta, props.max));
      },
    };
  },
});
</script>

<template>
  <div
    class="py-2 cursor-pointer s-hover-container"
    @wheel.stop.prevent="onWheel$$q"
    @mousedown.prevent="onMouseDown$$q"
    @touchstart.prevent="onMouseDown$$q()"
  >
    <div class="relative w-full h-full">
      <!-- track (bg) -->
      <div ref="e" class="absolute top-0 w-full h-full flex items-center">
        <div class="w-full h-1 bg-st-text opacity-20 rounded-full"></div>
      </div>
      <!-- track (progress) -->
      <div
        class="absolute top-0 h-full flex items-center"
        :class="$style.progress"
      >
        <div
          class="w-full h-1 rounded-full s-hover-hidden"
          :class="dragging$$q ? 'bg-primary' : 'bg-st-text opacity-70'"
        ></div>
        <div class="w-full h-1 rounded-full s-hover-visible bg-primary"></div>
      </div>
      <!-- thumb -->
      <div
        v-show="valid$$q"
        class="absolute top-0 h-full flex items-center"
        :class="[$style.thumb, dragging$$q ? '' : 's-hover-visible']"
      >
        <div
          class="w-3 -ml-1.5 h-3 border-1 bg-white/100 dark:bg-gray-200 border-gray-300 dark:border-gray-300 rounded-full"
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
</style>
