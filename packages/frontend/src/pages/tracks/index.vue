<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import TrackList from '@/components/TrackList.vue';
import {
  /*type*/
  MutableTrackDTOForPlayback,
  TrackDTOForPlayback,
} from '@/lib/dto';
import { sortTracks } from '@/lib/sort';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

export default defineComponent({
  components: {
    TrackList,
  },
  setup() {
    const tracks = ref<TrackDTOForPlayback[] | undefined>();

    const trackRepository = RepositoryFactory.get('track');

    trackRepository
      .fetchTracks$$q({}, [
        'album',
        'album.artistName',
        'album.artistName.artists',
        'album.images',
        'album.images.imageFiles',
        'artistName',
        'artistName.artists',
        'tags',
      ])
      .then((response) => {
        tracks.value = sortTracks(
          response.data as MutableTrackDTOForPlayback[],
          null,
          true
        );
      });

    return {
      tracks$$q: tracks,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">{{ $t('tracks/Tracks') }}</div>
    </header>
    <track-list
      :show-disc-number="false"
      :tracks="tracks$$q"
      :loading="!tracks$$q"
      :set-list="tracks$$q"
      index-content="albumArt"
      show-album
      show-artist
    ></track-list>
  </v-container>
</template>
