<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup() {
    return {};
  },
});
</script>

<template>
  <div class="no-image-root d-flex justify-center">
    <v-icon class="no-image-icon" light>mdi-image-off-outline</v-icon>
  </div>
</template>

<style scoped>
.no-image-root {
  background-color: rgba(127, 127, 127, 0.1);
}

.no-image-icon {
  font-size: 48px;
}
</style>
