<script lang="ts">
import { formatTime } from '~/logic/formatTime';

export default defineComponent({
  props: {
    showRemainingTime: Boolean,
    modelValue: {
      type: Number,
      default: undefined,
    },
    duration: {
      type: Number,
      default: undefined,
    },
  },
  emits: {
    'update:modelValue': (_newTime: number) => true,
    'update:showRemainingTime': (_newValue: boolean) => true,
  },
  setup(props, { emit }) {
    const draggingTime = ref<number | undefined>();

    const positionDisplay = computed<string | undefined>(() =>
      props.modelValue != null && props.duration != null
        ? formatTime(
            Math.floor(
              Math.min(draggingTime.value ?? props.modelValue, props.duration)
            ),
            props.duration
          )
        : undefined
    );

    const durationDisplay = computed<string | undefined>(() =>
      props.modelValue != null && props.duration != null
        ? props.showRemainingTime
          ? `-${formatTime(
              Math.max(
                Math.floor(props.duration) -
                  Math.floor(draggingTime.value ?? props.modelValue),
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
        emit('update:modelValue', value);
      },
      toggleRemaining$$q() {
        emit('update:showRemainingTime', !props.showRemainingTime);
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
      <SSlider
        :model-value="modelValue"
        :max="duration"
        @dragging="onDragging$$q"
        @update:model-value="onUpdate$$q"
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
