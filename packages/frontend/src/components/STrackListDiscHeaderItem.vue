<script lang="ts">
import type { PropType } from 'vue';

export interface ListItemDiscNumberHeader {
  type$$q: 'discNumberHeader';
  discNumber$$q: number;
  height$$q: number;
}

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
  <v-sheet tile class="w-full flex items-center gap-x-1 px-3 h-7">
    <v-icon>mdi-disc</v-icon>
    <span class="s-numeric font-semibold">
      {{ item.discNumber$$q }}
    </span>
  </v-sheet>
</template>
