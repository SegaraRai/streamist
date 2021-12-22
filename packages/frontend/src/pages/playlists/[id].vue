<script lang="ts">
export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
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
    <s-playlist :playlist="playlistId$$q" :link-excludes="[playlistId$$q]" />
  </v-container>
</template>
