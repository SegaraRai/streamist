<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import Playlist from '@/components/Playlist.vue';

export default defineComponent({
  components: {
    Playlist,
  },
  setup(_props: unknown, context) {
    const playlistId = computed(() => context.root.$route.params.id);

    return {
      playlistId$$q: playlistId,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-8 px-6">
    <playlist :playlist-id="playlistId$$q" :link-excludes="[playlistId$$q]" />
  </v-container>
</template>

<style lang="postcss" scoped>
.album-title {
  font-weight: 600;
}
</style>
