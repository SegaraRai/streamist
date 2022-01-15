<script lang="ts">
import { useDisplay } from 'vuetify';
import { compareTrack } from '$shared/sort';
import type { ResourceTrack } from '$/types';
import { useAllTrackMap, useAllTracks, useRecentlyPlayed } from '~/composables';
import { RECENTLY_UPLOADED_MAX_ENTRIES } from '~/config';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const { tracks$$q: recentlyPlayedTrackItems } = useRecentlyPlayed();

    const allTracks = useAllTracks();
    const allTrackMap = useAllTrackMap();

    useHead({
      title: t('title.Home'),
    });

    const recentlyUploadedTracks = computed(() => {
      const tracks = allTracks.value.value;
      return Array.from(tracks || [])
        .sort((a, b) => b.createdAt - a.createdAt || compareTrack(a, b))
        .slice(0, RECENTLY_UPLOADED_MAX_ENTRIES);
    });

    const recentlyPlayedTracks = computed(() => {
      const trackMap = allTrackMap.value.value;
      if (!trackMap) {
        return [];
      }
      return recentlyPlayedTrackItems.value
        .map((item) => trackMap.get(item.id))
        .filter((item): item is ResourceTrack => !!item);
    });

    return {
      t,
      recentlyUploadedTracks$$q: recentlyUploadedTracks,
      recentlyPlayedTracks$$q: recentlyPlayedTracks,
      isMobile$$q: display.smAndDown,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <div class="flex flex-col gap-y-16">
      <template v-if="recentlyPlayedTracks$$q?.length">
        <div>
          <header
            class="flex items-baseline gap-x-4 sticky top-0 bg-st-background z-1 pt-3 pb-2 -mx-2 px-2"
          >
            <div class="text-h5">{{ t('home.RecentlyPlayed') }}</div>
          </header>
          <s-track-list
            :show-disc-number="false"
            :tracks="recentlyPlayedTracks$$q"
            :loading="!recentlyPlayedTracks$$q"
            :set-list="recentlyPlayedTracks$$q"
            :set-list-name="t('setListName.RecentlyPlayed')"
            index-content="albumArtwork"
            :show-album="!isMobile$$q"
            show-artist
            :hide-duration="isMobile$$q"
            visit-album
            visit-artist
            show-delete
          />
        </div>
      </template>
      <template v-if="recentlyUploadedTracks$$q?.length">
        <div>
          <header
            class="flex items-baseline gap-x-4 sticky top-0 bg-st-background z-1 pt-3 pb-2"
          >
            <div class="text-h5">{{ t('home.RecentlyUploaded') }}</div>
          </header>
          <s-track-list
            :show-disc-number="false"
            :tracks="recentlyUploadedTracks$$q"
            :loading="!recentlyUploadedTracks$$q"
            :set-list="recentlyUploadedTracks$$q"
            :set-list-name="t('setListName.RecentlyUploaded')"
            index-content="albumArtwork"
            :show-album="!isMobile$$q"
            show-artist
            :hide-duration="isMobile$$q"
            visit-album
            visit-artist
            show-delete
          />
        </div>
      </template>
    </div>
  </v-container>
</template>
