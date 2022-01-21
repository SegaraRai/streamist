<script lang="ts">
export default defineComponent({
  props: {
    to: {
      type: String,
      default: undefined,
    },
    disabled: Boolean,
  },
});
</script>

<template>
  <template v-if="disabled || !to">
    <span>
      <slot></slot>
    </span>
  </template>
  <template v-else>
    <RouterLink :to="to">
      <slot></slot>
    </RouterLink>
  </template>
</template>
