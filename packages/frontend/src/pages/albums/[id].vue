<script lang="ts">
import { fetchAlbumForPlaybackWithTracks } from '~/resources/album';
import type {
  AlbumForPlaybackWithTracks,
  TrackForPlayback,
} from '~/types/playback';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const albumId = computed(() => props.id);

    const album = ref<AlbumForPlaybackWithTracks | undefined>();
    const setList = ref<TrackForPlayback[] | undefined>();

    const loading = computed(() => album.value?.id !== albumId.value);

    watch(
      albumId,
      (newAlbumId, _oldValue) => {
        fetchAlbumForPlaybackWithTracks(newAlbumId).then((newAlbum) => {
          if (newAlbum.id !== albumId.value) {
            return;
          }

          album.value = newAlbum;
          setList.value = newAlbum.tracks;
        });
      },
      {
        immediate: true,
      }
    );

    return {
      album$$q: album,
      albumId$$q: albumId,
      loading$$q: loading,
      setList$$q: setList,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-8 px-6">
    <album
      :album="album$$q"
      :album-id="albumId$$q"
      :loading="loading$$q"
      :link-excludes="[albumId$$q]"
      :set-list="setList$$q"
    />
  </v-container>
</template>

<style scoped>
.album-title {
  font-weight: 600;
}
</style>
