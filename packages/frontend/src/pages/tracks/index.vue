<script lang="ts">
import { useDisplay } from 'vuetify';
import { compareTrack } from '$shared/sort';
import type { ResourceAlbum, ResourceArtist } from '$/types';
import { useAllAlbums, useAllArtists, useAllTracks } from '~/logic/useDB';
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
      playbackStore.setDefaultSetList$$q();
    });

    const items = asyncComputed(async () => {
      const tracks = await allTracks.valueAsync.value;
      const albums = await allAlbums.valueAsync.value;
      const artists = await allArtists.valueAsync.value;

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
        playbackStore.setDefaultSetList$$q(sortedTracks);
      }

      return sortedTracks;
    }, []);

    return {
      t,
      items$$q: items,
      isMobile$$q: display.smAndDown,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">
        {{ t('tracks.Tracks') }}
      </div>
      <template v-if="items$$q.length">
        <div class="opacity-60">
          {{ t('tracks.n_tracks', items$$q.length) }}
        </div>
      </template>
    </header>
    <s-track-list
      :show-disc-number="false"
      :tracks="items$$q"
      :loading="!items$$q"
      :set-list="items$$q"
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
