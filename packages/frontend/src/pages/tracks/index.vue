<script lang="ts">
import { useDisplay } from 'vuetify';
import { fetchTracksForPlayback } from '~/resources/track';
import { usePlaybackStore } from '~/stores/playback';
import type { TrackForPlayback } from '~/types/playback';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    const tracks = ref<TrackForPlayback[] | undefined>();

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q.value();
    });

    fetchTracksForPlayback().then((response) => {
      tracks.value = response;
      playbackStore.setDefaultSetList$$q.value(response);
    });

    return {
      t,
      tracks$$q: tracks,
      isMobile$$q: display.smAndDown,
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6">
      <div class="text-h5">
        {{ t('tracks.Tracks') }}
      </div>
    </header>
    <s-track-list
      :show-disc-number="false"
      :tracks="tracks$$q"
      :loading="!tracks$$q"
      :set-list="tracks$$q"
      index-content="albumArtwork"
      :show-album="!isMobile$$q"
      show-artist
      :hide-duration="isMobile$$q"
    />
  </v-container>
</template>
