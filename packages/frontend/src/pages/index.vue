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
      title: t('title.Home'),
    });

    const allTracks = useAllTracks();
    const allAlbums = useAllAlbums();
    const allArtists = useAllArtists();

    let unmounted = false;
    onBeforeUnmount(() => {
      unmounted = true;
      playbackStore.clearDefaultSetList$$q();
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
        .sort((a, b) => b.createdAt - a.createdAt || compareTrack(a, b))
        .slice(0, 40);

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          t('setListName.RecentlyUploaded'),
          sortedTracks
        );
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
      <div class="text-h5">Home</div>
    </header>

    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">Recently played</div>
    </header>

    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">Recently uploaded</div>
    </header>
    <s-track-list
      :show-disc-number="false"
      :tracks="items$$q"
      :loading="!items$$q"
      :set-list="items$$q"
      :set-list-name="t('setListName.Tracks')"
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
