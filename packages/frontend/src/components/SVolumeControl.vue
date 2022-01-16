<script lang="ts">
export default defineComponent({
  props: {
    modelValue: {
      type: Number,
      default: 100,
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
      volume$$q,
      icon$$q: computed(() => {
        const volume = draggingVolume$$q.value ?? volume$$q.value;
        if (volume === 0) {
          return 'mdi-volume-mute';
        }
        if (volume <= 50) {
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
    <button class="flex-none p-0 m-0" @click="toggleMute$$q">
      <v-icon>{{ icon$$q }}</v-icon>
    </button>
    <div class="ml-2 flex-1">
      <s-slider
        :value="volume$$q"
        :max="100"
        @dragging="onDragging$$q"
        @update="onUpdate$$q"
      />
    </div>
  </div>
</template>
