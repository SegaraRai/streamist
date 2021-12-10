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
  <template v-if="disabled || to == null">
    <span>
      <slot />
    </span>
  </template>
  <template v-else>
    <router-link :to="to">
      <slot />
    </router-link>
  </template>
</template>
