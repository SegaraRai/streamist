<script lang="ts">
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
  },
  setup(props) {
    const rate = computed(() =>
      props.max != null && props.modelValue != null && props.max > 0
        ? Math.max(Math.min(props.modelValue / props.max, 1), 0)
        : 0
    );

    const position = computed(() => `${100 * rate.value}%`);

    return {
      p: position,
    };
  },
});
</script>

<template>
  <div class="relative">
    <!-- track (bg) -->
    <div ref="e" class="absolute top-0 w-full h-full flex items-center">
      <div class="w-full h-full bg-primary opacity-20"></div>
    </div>
    <!-- track (progress) -->
    <div
      class="absolute top-0 h-full flex items-center"
      :class="$style.progress"
    >
      <div class="w-full h-full rounded-r-full bg-primary"></div>
    </div>
  </div>
</template>

<style module>
.progress {
  width: v-bind('p');
}
</style>
