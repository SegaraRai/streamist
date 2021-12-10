<script lang="ts">
import { fetchTracksForPlayback } from '~/resources/track';
import type { TrackForPlayback } from '~/types/playback';

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const tracks = ref<TrackForPlayback[] | undefined>();

    fetchTracksForPlayback().then((response) => {
      tracks.value = response;
    });

    return {
      t,
      tracks$$q: tracks,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">{{ t('tracks.Tracks') }}</div>
    </header>
    <track-list
      :show-disc-number="false"
      :tracks="tracks$$q"
      :loading="!tracks$$q"
      :set-list="tracks$$q"
      index-content="albumArt"
      show-album
      show-artist
    />
  </v-container>
</template>
