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
  <v-sheet tile class="sheet-disc-number-header w-full h-6">
    <v-list-subheader class="list-disc-number-header">
      <div class="list-column-disc-number flex align-center">
        <v-icon>mdi-disc</v-icon>
        <span class="disc-number-text s-numeric">
          {{ item.discNumber$$q }}
        </span>
      </div>
    </v-list-subheader>
    <v-divider />
  </v-sheet>
</template>
