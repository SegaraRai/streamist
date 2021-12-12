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
    update: (_newTime: number) => true,
  },
  setup(props, context) {
    const draggingTime = ref<number | undefined>();

    const positionDisplay = computed<string | undefined>(() =>
      props.currentTime != null && props.duration != null
        ? formatTime(draggingTime.value ?? props.currentTime, props.duration)
        : undefined
    );

    const durationDisplay = computed<string | undefined>(() =>
      props.currentTime != null && props.duration != null
        ? formatTime(props.duration)
        : undefined
    );

    return {
      positionDisplay$$q: positionDisplay,
      durationDisplay$$q: durationDisplay,
      onDragging$$q(value: number | undefined) {
        draggingTime.value = value;
      },
      onUpdate$$q(value: number) {
        draggingTime.value = undefined;
        context.emit('update', value);
      },
    };
  },
});
</script>

<template>
  <div class="flex flex-row justify-center h-6">
    <div :class="$style.time">
      {{ positionDisplay$$q }}
    </div>
    <div class="seek-bar px-4 flex-grow-1 d-flex flex-column justify-center">
      <s-slider
        :value="currentTime"
        :max="duration"
        @dragging="onDragging$$q"
        @update="onUpdate$$q"
      />
    </div>
    <div :class="$style.time">
      {{ durationDisplay$$q }}
    </div>
  </div>
</template>

<style module>
.time {
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
</style>
