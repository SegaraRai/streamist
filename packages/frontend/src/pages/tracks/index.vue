<route lang="yaml">
meta:
  layout: app
</route>

<script lang="ts">
import { useDisplay } from 'vuetify';
import { compareTrack } from '$/shared/sort';
import type { ResourceAlbum, ResourceArtist } from '$/types';
import { useAllAlbums, useAllArtists, useAllTracks } from '~/composables';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    useHead({
      title: t('title.Tracks'),
    });

    const allTracks = useAllTracks();
    const allAlbums = useAllAlbums();
    const allArtists = useAllArtists();

    let unmounted = false;
    onBeforeUnmount(() => {
      unmounted = true;
      playbackStore.clearDefaultSetList$$q();
    });

    const items = computed(() => {
      const tracks = allTracks.value.value;
      const albums = allAlbums.value.value;
      const artists = allArtists.value.value;
      if (!tracks || !albums || !artists) {
        return [];
      }

      const albumMap = new Map<string, ResourceAlbum>(
        albums.map((album) => [album.id, album])
      );
      const artistMap = new Map<string, ResourceArtist>(
        artists.map((artist) => [artist.id, artist])
      );

      const sortedTracks = tracks
        .map((track) => {
          const album = albumMap.get(track.albumId)!;
          const artist = artistMap.get(track.artistId)!;
          const albumArtist = artistMap.get(album.artistId)!;
          return {
            ...track,
            album: {
              ...album,
              artist: albumArtist,
            },
            artist,
          };
        })
        .sort(compareTrack);

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          t('setListName.Tracks'),
          sortedTracks
        );
      }

      return sortedTracks;
    });

    return {
      t,
      items$$q: items,
      isMobile$$q: display.smAndDown,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <header class="s-title">
      <div class="text-h5">
        {{ t('tracks.Tracks') }}
      </div>
      <template v-if="items$$q.length">
        <div class="s-subheading">
          {{ t('tracks.n_items', items$$q.length) }}
        </div>
      </template>
    </header>
    <s-track-list
      :show-disc-number="false"
      :tracks="items$$q"
      :loading="!items$$q"
      :set-list="items$$q"
      :set-list-name="t('setListName.Tracks')"
      skip-set-list-check
      index-content="albumArtwork"
      :show-album="!isMobile$$q"
      show-artist
      :hide-duration="isMobile$$q"
      visit-album
      visit-artist
      show-delete
    />
  </v-container>
</template>
