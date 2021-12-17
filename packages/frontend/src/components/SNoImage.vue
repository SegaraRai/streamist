<script lang="ts">
export default defineComponent({
  props: {
    iconSize: {
      type: [String, Number],
      default: '48px',
    },
  },
  setup(props) {
    return {
      s: computed(() => {
        if (typeof props.iconSize === 'string') {
          return props.iconSize;
        }
        const numIconSize = props.iconSize;
        if (!isFinite(numIconSize) || numIconSize < 0) {
          return '';
        }
        return `${numIconSize}px`;
      }),
    };
  },
});
</script>

<template>
  <div class="no-image-root flex align-center justify-center">
    <template v-if="s">
      <v-icon class="no-image-icon" light>mdi-image-off-outline</v-icon>
    </template>
  </div>
</template>

<style scoped>
.no-image-root {
  background-color: rgba(127, 127, 127, 0.1);
}

.no-image-icon {
  font-size: v-bind('s');
}
</style>
