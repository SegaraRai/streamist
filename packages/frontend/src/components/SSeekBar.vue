<script lang="ts">
export default defineComponent({
  props: {
    currentTime: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  emits: {
    update: (_position: number) => true,
  },
  setup(props) {
    const valid = computed(
      () =>
        props.currentTime != null &&
        props.duration != null &&
        props.currentTime >= 0 &&
        props.duration > 0
    );
    return {
      valid,
      p: computed(() =>
        valid.value ? `${(100 * props.currentTime) / props.duration}%` : '0%'
      ),
    };
  },
});
</script>

<template>
  <div class="pc-container py-2">
    <div class="relative w-full h-full">
      <div class="absolute top-0 w-full h-full flex items-center mx-1">
        <div class="w-full h-1 bg-gray-100 rounded-full" />
      </div>
      <div class="absolute top-0 h-full flex items-center pc-track-played mx-1">
        <div class="w-full h-1 bg-gray-500 rounded-full" />
      </div>
      <div
        v-show="valid"
        class="absolute top-0 h-full flex items-center mx-1 pc-thumb"
      >
        <div
          class="w-3 -ml-1.5 h-3 bg-gray-200 border-1 border-gray-300 rounded-full"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-thumb {
  left: v-bind('p');
  opacity: 0;
}

.pc-track-played {
  width: v-bind('p');
}

.pc-container:hover .pc-thumb {
  opacity: 1;
}
</style>
