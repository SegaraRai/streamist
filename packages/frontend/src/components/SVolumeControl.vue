<script lang="ts">
import { HALF_VOLUME, MAX_VOLUME, MIN_VOLUME } from '$shared/config';

export default defineComponent({
  props: {
    modelValue: {
      type: Number,
      default: MAX_VOLUME,
    },
  },
  emits: {
    dragging: (_newVolume: number) => true,
    'update:modelValue': (_newVolume: number) => true,
    mute: () => true,
  },
  setup(props, { emit }) {
    const draggingVolume$$q = ref<number | undefined>();
    const volume$$q = ref(props.modelValue);
    watch(
      computed(() => props.modelValue),
      (newVolume) => {
        volume$$q.value = newVolume;
      }
    );
    return {
      maxVolume$$q: MAX_VOLUME,
      volume$$q,
      icon$$q: computed(() => {
        const volume = draggingVolume$$q.value ?? volume$$q.value;
        if (volume === MIN_VOLUME) {
          return 'mdi-volume-mute';
        }
        if (volume <= HALF_VOLUME) {
          return 'mdi-volume-medium';
        }
        return 'mdi-volume-high';
      }),
      onDragging$$q(newVolume: number | undefined) {
        if (newVolume == null) {
          return;
        }
        emit('dragging', newVolume);
        volume$$q.value = newVolume;
      },
      onUpdate$$q(newVolume: number) {
        emit('update:modelValue', newVolume);
        volume$$q.value = newVolume;
      },
      toggleMute$$q() {
        emit('mute');
      },
    };
  },
});
</script>

<template>
  <div class="flex flex-row items-center h-6">
    <button class="flex-none p-0 m-0 transition-colors" @click="toggleMute$$q">
      <VIcon>{{ icon$$q }}</VIcon>
    </button>
    <div class="ml-2 flex-1">
      <SSlider
        :value="volume$$q"
        :max="maxVolume$$q"
        @dragging="onDragging$$q"
        @update="onUpdate$$q"
      />
    </div>
  </div>
</template>
