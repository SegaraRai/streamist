<script lang="ts">
import { formatTime } from '@/logic/formatTime';

export default defineComponent({
  props: {
    currentTime: {
      type: Number,
      default: undefined,
    },
    duration: {
      type: Number,
      default: undefined,
    },
  },
  emits: {
    update: (_position: number) => true,
    dragging: (_position: number | undefined) => true,
  },
  setup(props, context) {
    const valid = computed(
      () => props.currentTime != null && props.duration != null
    );

    const rate = computed(() =>
      props.currentTime != null && props.duration != null && props.duration > 0
        ? props.currentTime / props.duration
        : 0
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

    watch(mousePosition, (newPosition) => {
      if (dragging.value && props.duration) {
        context.emit('dragging', newPosition * props.duration);
      }
    });

    watch(pressed, (newPressed, oldPressed) => {
      if (newPressed === oldPressed || newPressed || !dragging.value) {
        return;
      }

      dragging.value = false;

      if (valid.value && props.duration) {
        context.emit('update', mousePosition.value * props.duration);
      }
    });

    const positionDisplay = computed<string | undefined>(() =>
      valid.value && props.currentTime != null && props.duration != null
        ? formatTime(
            dragging.value
              ? mousePosition.value * props.duration
              : props.currentTime,
            props.duration
          )
        : undefined
    );

    const durationDisplay = computed<string | undefined>(() =>
      valid.value && props.currentTime != null && props.duration != null
        ? formatTime(props.duration)
        : undefined
    );

    return {
      valid,
      e,
      p: computed(() =>
        valid.value
          ? dragging.value
            ? `${100 * mousePosition.value}%`
            : `${100 * rate.value}%`
          : '0%'
      ),
      dragging,
      positionDisplay$$q: positionDisplay,
      durationDisplay$$q: durationDisplay,
      onMouseDown() {
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
  <div class="flex flex-row justify-center h-6">
    <div class="seek-bar-duration">
      {{ positionDisplay$$q }}
    </div>
    <div class="seek-bar px-4 flex-grow-1 d-flex flex-column justify-center">
      <div
        class="pc-container py-2 cursor-pointer"
        @mousedown.prevent="onMouseDown"
        @touchstart.prevent="onMouseDown"
      >
        <div class="relative w-full h-full">
          <div
            ref="e"
            class="absolute top-0 w-full h-full flex items-center mx-1"
          >
            <div class="w-full h-1 bg-gray-100 rounded-full"></div>
          </div>
          <div
            class="absolute top-0 h-full flex items-center pc-track-played mx-1"
          >
            <div class="w-full h-1 bg-gray-500 rounded-full"></div>
          </div>
          <div
            v-show="valid"
            class="absolute top-0 h-full flex items-center mx-1 pc-thumb"
            :class="dragging ? '' : 'opacity-0'"
          >
            <div
              class="w-3 -ml-1.5 h-3 bg-gray-200 border-1 border-gray-300 rounded-full"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div class="seek-bar-duration">
      {{ durationDisplay$$q }}
    </div>
  </div>
</template>

<style scoped>
.seek-bar-duration {
  @apply tabular-nums;
  @apply lining-nums;
  @apply leading-none;
  @apply select-none;
  @apply w-4;
  @apply flex;
  @apply flex-col;
  @apply justify-center;
  @apply text-sm;
}

.pc-thumb {
  left: v-bind('p');
}

.pc-track-played {
  width: v-bind('p');
}

.pc-container:hover .pc-thumb {
  opacity: 1;
}
</style>
