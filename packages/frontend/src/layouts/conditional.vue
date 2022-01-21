<script lang="ts">
import { loggedInRef } from '~/stores/auth';
import LayoutApp from './app.vue';
import LayoutDefault from './default.vue';

export default defineComponent({
  components: {
    LayoutApp,
    LayoutDefault,
  },
  setup() {
    return {
      loggedIn$$q: loggedInRef.value,
    };
  },
});
</script>

<template>
  <template v-if="loggedIn$$q">
    <LayoutApp />
  </template>
  <template v-else>
    <LayoutDefault />
  </template>
</template>
