<script lang="ts">
import { formatTime } from '~/logic/formatTime';

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
  setup(props, { emit }) {
    const showRemaining = ref(false);
    const draggingTime = ref<number | undefined>();

    const positionDisplay = computed<string | undefined>(() =>
      props.currentTime != null && props.duration != null
        ? formatTime(
            Math.min(draggingTime.value ?? props.currentTime, props.duration),
            props.duration
          )
        : undefined
    );

    const durationDisplay = computed<string | undefined>(() =>
      props.currentTime != null && props.duration != null
        ? showRemaining.value
          ? `-${formatTime(
              Math.max(
                props.duration - (draggingTime.value ?? props.currentTime),
                0
              ),
              props.duration
            )}`
          : formatTime(props.duration)
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
        emit('update', value);
      },
      toggleRemaining$$q() {
        showRemaining.value = !showRemaining.value;
      },
    };
  },
});
</script>

<template>
  <div class="flex flex-row justify-center h-6 gap-x-2">
    <div :class="$style.time" class="text-right">
      {{ positionDisplay$$q }}
    </div>
    <div class="seek-bar flex-1 flex flex-col justify-center">
      <s-slider
        :value="currentTime"
        :max="duration"
        @dragging="onDragging$$q"
        @update="onUpdate$$q"
      />
    </div>
    <div :class="$style.time" @click="toggleRemaining$$q">
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
  @apply w-12;
  @apply flex-none;
  @apply flex;
  @apply flex-col;
  @apply justify-center;
  @apply text-sm;
}
</style>
