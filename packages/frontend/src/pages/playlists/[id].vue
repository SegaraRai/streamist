<script lang="ts">
export default defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    const playlistId = computed(() => props.id);

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
