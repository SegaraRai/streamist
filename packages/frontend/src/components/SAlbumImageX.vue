<script lang="ts">
import type { PropType } from 'vue';
import type { ResourceImage } from '$/types';

export default defineComponent({
  props: {
    image: {
      type: [Boolean, Object] as PropType<
        ResourceImage | null | undefined | false
      >,
      default: undefined,
    },
    alt: {
      type: String,
      default: undefined,
    },
  },
});
</script>

<template>
  <s-nullable-image class="select-none" :image="image" :alt="alt" />
</template>
