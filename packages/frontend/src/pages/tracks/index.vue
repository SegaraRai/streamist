<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<script lang="ts">
import { useDisplay } from 'vuetify';
import { filterNullAndUndefined } from '$shared/filter';
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
        return;
      }

      const albumMap = new Map<string, ResourceAlbum>(
        albums.map((album) => [album.id, album])
      );
      const artistMap = new Map<string, ResourceArtist>(
        artists.map((artist) => [artist.id, artist])
      );

      const sortedTracks = filterNullAndUndefined(
        tracks.map((track) => {
          const album = albumMap.get(track.albumId);
          const artist = artistMap.get(track.artistId);
          const albumArtist = album && artistMap.get(album.artistId);
          if (!album || !artist || !albumArtist) {
            return;
          }
          return {
            ...track,
            album: {
              ...album,
              artist: albumArtist,
            },
            artist,
          };
        })
      ).sort(compareTrack);

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          t('setListName.Tracks'),
          sortedTracks.map((track) => track.id)
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
  <VContainer fluid class="pt-0">
    <header class="s-title">
      <div class="text-h5">
        {{ t('tracks.Tracks') }}
      </div>
      <template v-if="items$$q?.length">
        <div class="s-subheading-sl">
          {{ t('tracks.n_items', items$$q.length) }}
        </div>
      </template>
    </header>
    <template v-if="items$$q">
      <template v-if="items$$q.length">
        <STrackList
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
      </template>
      <template v-else>
        <div class="text-base mt-4">
          {{ t('tracks.no_items') }}
        </div>
      </template>
    </template>
  </VContainer>
</template>
