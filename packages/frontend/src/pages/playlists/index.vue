<script lang="ts">
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import type { DropdownPlaylistInput } from '~/components/SDropdownPlaylist.vue';
import { useAllPlaylists, useAllTrackMap } from '~/composables';
import { calcTracksTotalDuration, formatTotalDuration } from '~/logic/duration';
import { usePlaybackStore } from '~/stores/playback';

interface Item {
  readonly playlist$$q: ResourcePlaylist;
  readonly tracks$$q: readonly ResourceTrack[];
  readonly id$$q: string;
  readonly title$$q: string;
  readonly description$$q: string;
  readonly trackCount$$q: number;
  readonly duration$$q: number;
  readonly formattedDuration$$q: string;
  readonly isLast$$q: boolean;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    useHead({
      title: t('title.Playlists'),
    });

    onBeforeUnmount(() => {
      playbackStore.clearDefaultSetList$$q();
    });

    const allPlaylists = useAllPlaylists();
    const allTrackMap = useAllTrackMap();

    const items = computed(() => {
      const playlists = allPlaylists.value.value;
      const trackMap = allTrackMap.value.value;
      if (!playlists || !trackMap) {
        return [];
      }

      // NOTE: setDefaultSetList is intentionally not called because users will not want this behavior

      return playlists.map((playlist, index, arr): Item => {
        const tracks = playlist.trackIds.map(
          (trackId) => trackMap.get(trackId)!
        );
        const duration = calcTracksTotalDuration(tracks);
        return {
          playlist$$q: playlist,
          tracks$$q: tracks,
          id$$q: playlist.id,
          title$$q: playlist.title,
          description$$q: playlist.description,
          trackCount$$q: tracks.length,
          duration$$q: duration,
          formattedDuration$$q: formatTotalDuration(
            duration,
            t('vendor.humanizeDuration.language')
          ),
          isLast$$q: index === arr.length - 1,
        };
      });
    });

    const selectedPlaylist$$q = ref<ResourcePlaylist | undefined>();
    const dropdown$$q = ref<DropdownPlaylistInput | undefined>();

    return {
      t,
      items$$q: items,
      showCreateDialog$$q: ref(false),
      selectedPlaylist$$q,
      dropdown$$q,
      showMenu$$q: (target: MouseEvent | HTMLElement, item: Item) => {
        dropdown$$q.value = {
          target$$q: target,
          playlist$$q: item.playlist$$q,
          tracks$$q: item.tracks$$q,
        };
      },
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <header
      class="flex items-baseline gap-x-4 sticky top-0 bg-st-background z-1 pt-3 pb-2 -mx-2 px-2 mb-4"
    >
      <div class="text-h5">
        {{ t('playlists.Playlists') }}
      </div>
      <template v-if="items$$q.length">
        <div class="light:font-medium opacity-60">
          {{ t('playlists.n_items', items$$q.length || 0) }}
        </div>
      </template>
    </header>
    <div class="mb-6 flex items-center gap-x-8">
      <v-btn color="primary" flat icon @click="showCreateDialog$$q = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-divider />
    </div>
    <div
      :class="selectedPlaylist$$q ? 's-list--selected' : 's-list--unselected'"
    >
      <template v-if="items$$q.length">
        <v-list flat @contextmenu.prevent>
          <template v-for="(item, _index) in items$$q" :key="_index">
            <v-list-item
              :disabled="!!selectedPlaylist$$q"
              :to="`/playlists/${item.id$$q}`"
              class="flex gap-x-4 s-hover-container opacity-100"
              :class="
                selectedPlaylist$$q?.id === item.id$$q
                  ? 's-list-item--selected'
                  : 's-list-item--unselected'
              "
              @contextmenu.prevent="showMenu$$q($event, item)"
            >
              <s-playlist-image
                class="flex-none w-9 h-9"
                size="36"
                :playlist="item.playlist$$q"
              />
              <v-list-item-header class="flex-1">
                <v-list-item-title>{{ item.title$$q }}</v-list-item-title>
                <v-list-item-subtitle>
                  <span>{{ t('playlists.n_tracks', item.trackCount$$q) }}</span>
                  <template v-if="item.trackCount$$q">
                    <span>, {{ item.formattedDuration$$q }}</span>
                  </template>
                </v-list-item-subtitle>
              </v-list-item-header>
              <v-btn
                icon
                flat
                text
                size="small"
                class="bg-transparent"
                @click.prevent.stop="showMenu$$q($event.target as HTMLElement, item)"
              >
                <v-icon class="s-hover-visible">mdi-dots-vertical</v-icon>
              </v-btn>
            </v-list-item>
          </template>
        </v-list>
      </template>
      <template v-else>
        <div>No playlists here</div>
      </template>
    </div>
    <s-dropdown-playlist
      v-model="dropdown$$q"
      v-model:show-create-dialog="showCreateDialog$$q"
      show-create-item
      @update:selected-playlist="selectedPlaylist$$q = $event"
    />
  </v-container>
</template>
