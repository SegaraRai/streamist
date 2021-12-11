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
    /** 0 ~ 1 */
    const draggingPosition = ref<number | undefined>();

    const onMouseMove = (event: MouseEvent | TouchEvent) => {
      if (!dragging.value || !e.value) {
        return;
      }

      const bBox = e.value.getBoundingClientRect();
      const position = Math.max(
        Math.min((event.clientX - bBox.x) / bBox.width, 1),
        0
      );
      draggingPosition.value = position;
      context.emit('dragging', position * props.duration);
    };

    const onMouseUp = (event: MouseEvent | TouchEvent) => {
      if (!dragging.value || !e.value) {
        return;
      }

      onMouseMove(event);
      const finalPosition = draggingPosition.value;
      context.emit('dragging', undefined);
      context.emit('update', finalPosition! * props.duration);

      setTimeout(() => {
        dragging.value = false;
        draggingPosition.value = undefined;
      }, 10);
    };

    onMounted(() => {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('touchmove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchend', onMouseUp);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onMouseUp);
    });

    const positionDisplay = computed<string | undefined>(() =>
      valid.value && props.currentTime != null && props.duration != null
        ? formatTime(
            dragging.value && draggingPosition.value != null
              ? draggingPosition.value * props.duration
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
          ? dragging.value && draggingPosition.value != null
            ? `${100 * draggingPosition.value}%`
            : `${100 * rate.value}%`
          : '0%'
      ),
      dragging,
      positionDisplay$$q: positionDisplay,
      durationDisplay$$q: durationDisplay,
      onMouseDown(event) {
        if (!valid.value || !e.value) {
          return;
        }

        dragging.value = true;
        onMouseMove(event);
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
        class="pc-container py-2"
        @mousedown.prevent="onMouseDown"
        @touchstart.prevent="onMouseDown"
      >
        <div class="relative w-full h-full">
          <div
            ref="e"
            class="absolute top-0 w-full h-full flex items-center mx-1"
          >
            <div class="w-full h-1 bg-gray-100 rounded-full" />
          </div>
          <div
            class="absolute top-0 h-full flex items-center pc-track-played mx-1"
          >
            <div class="w-full h-1 bg-gray-500 rounded-full" />
          </div>
          <div
            v-show="valid"
            class="absolute top-0 h-full flex items-center mx-1 pc-thumb"
            :class="dragging ? '' : 'opacity-0'"
          >
            <div
              class="w-3 -ml-1.5 h-3 bg-gray-200 border-1 border-gray-300 rounded-full"
            />
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
