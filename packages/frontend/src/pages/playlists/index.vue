<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<script lang="ts">
import { filterNullAndUndefined } from '$shared/filter';
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
        return;
      }

      // NOTE: setDefaultSetList is intentionally not called because users will not want this behavior

      return playlists.map((playlist, index, arr): Item => {
        const tracks = filterNullAndUndefined(
          playlist.trackIds.map((trackId) => trackMap.get(trackId))
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
  <VContainer fluid class="pt-0">
    <header class="s-title mb-4">
      <div class="text-h5">
        {{ t('playlists.Playlists') }}
      </div>
      <template v-if="items$$q?.length">
        <div class="s-subheading-sl">
          {{ t('playlists.n_items', items$$q.length || 0) }}
        </div>
      </template>
    </header>
    <div class="mb-6 flex items-center gap-x-8">
      <VBtn color="primary" flat icon @click="showCreateDialog$$q = true">
        <i-mdi-plus />
      </VBtn>
      <VDivider />
    </div>
    <template v-if="items$$q">
      <template v-if="items$$q.length">
        <div
          :class="
            selectedPlaylist$$q ? 's-list--selected' : 's-list--unselected'
          "
        >
          <VList flat @contextmenu.prevent>
            <template v-for="(item, _index) in items$$q" :key="_index">
              <VListItem
                :_="(_index || undefined) && undefined"
                :disabled="!!selectedPlaylist$$q"
                :to="`/playlists/${item.id$$q}`"
                class="flex gap-x-4 s-hover-container opacity-100 rounded-4px"
                :class="
                  selectedPlaylist$$q?.id === item.id$$q
                    ? 's-list-item--selected'
                    : 's-list-item--unselected'
                "
                @contextmenu.prevent="showMenu$$q($event, item)"
              >
                <SPlaylistImage
                  class="flex-none w-9 h-9"
                  size="36"
                  :playlist="item.playlist$$q"
                />
                <VListItemHeader class="flex-1">
                  <VListItemTitle class="s-heading-sl">
                    {{ item.title$$q }}
                  </VListItemTitle>
                  <VListItemSubtitle class="s-subheading-sl text-xs">
                    <span>
                      {{ t('playlists.n_tracks', item.trackCount$$q) }}
                    </span>
                    <template v-if="item.trackCount$$q">
                      <span>, {{ item.formattedDuration$$q }}</span>
                    </template>
                  </VListItemSubtitle>
                </VListItemHeader>
                <VBtn
                  icon
                  flat
                  text
                  size="small"
                  class="bg-transparent"
                  @click.prevent.stop="showMenu$$q($event.target as HTMLElement, item)"
                >
                  <i-mdi-dots-vertical class="s-hover-visible" />
                </VBtn>
              </VListItem>
            </template>
          </VList>
        </div>
      </template>
      <template v-else>
        <div class="text-base">
          {{ t('playlists.no_items') }}
        </div>
      </template>
      <SDropdownPlaylist
        v-model="dropdown$$q"
        v-model:show-create-dialog="showCreateDialog$$q"
        show-create-item
        @update:selected-playlist="selectedPlaylist$$q = $event"
      />
    </template>
  </VContainer>
</template>
