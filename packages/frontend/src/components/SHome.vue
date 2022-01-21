<script lang="ts">
import { useDisplay } from 'vuetify';
import { filterNullAndUndefined } from '$shared/filter';
import { compareTrack } from '$/shared/sort';
import { useAllTrackMap, useAllTracks, useRecentlyPlayed } from '~/composables';
import { RECENTLY_UPLOADED_MAX_ENTRIES } from '~/config';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const { tracks$$q: recentlyPlayedTrackItems } = useRecentlyPlayed();

    const allTracks = useAllTracks();
    const allTrackMap = useAllTrackMap();

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
      return filterNullAndUndefined(
        recentlyPlayedTrackItems.value.map((item) => trackMap.get(item.id))
      );
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
  <STutorialPage>
    <div class="flex flex-col gap-y-16">
      <template v-if="recentlyPlayedTracks$$q?.length">
        <div>
          <header class="s-title">
            <div class="text-h5">{{ t('home.RecentlyPlayed') }}</div>
          </header>
          <STrackList
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
          />
        </div>
      </template>
      <template v-if="recentlyUploadedTracks$$q?.length">
        <div>
          <header class="s-title">
            <div class="text-h5">{{ t('home.RecentlyUploaded') }}</div>
          </header>
          <STrackList
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
          />
        </div>
      </template>
    </div>
  </STutorialPage>
</template>
