<script lang="ts">
import { fetchAlbumForPlaybackWithTracks } from '~/resources/album';
import { usePlaybackStore } from '~/stores/playback';
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
    const playbackStore = usePlaybackStore();

    const albumId = computed(() => props.id);

    const album = ref<AlbumForPlaybackWithTracks | undefined>();
    const setList = ref<TrackForPlayback[] | undefined>();

    const loading = computed(() => album.value?.id !== albumId.value);

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q.value();
    });

    watch(
      albumId,
      (newAlbumId, _oldValue) => {
        fetchAlbumForPlaybackWithTracks(newAlbumId).then((newAlbum) => {
          if (newAlbum.id !== albumId.value) {
            return;
          }

          const responseSetList = newAlbum.tracks;

          album.value = newAlbum;
          setList.value = responseSetList;
          playbackStore.setDefaultSetList$$q.value(responseSetList);
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
    <s-album
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
