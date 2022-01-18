<script lang="ts">
import type { PropType } from 'vue';

export interface ListItemDiscNumberHeader {
  type$$q: 'discNumberHeader';
  discNumber$$q: number;
  height$$q: number;
}

export const discHeaderHeight = 32;

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ListItemDiscNumberHeader>,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <div class="w-full h-8 flex items-center gap-x-1 px-1">
    <v-icon>mdi-disc</v-icon>
    <span class="s-numeric font-medium">{{ item.discNumber$$q }}</span>
  </div>
</template>
