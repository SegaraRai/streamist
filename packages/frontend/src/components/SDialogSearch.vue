<script lang="ts">
import { compareTrack } from '$shared/sort';
import { db } from '~/db';
import type { AllItem } from '~/logic/allItem';
import { useAllSearch } from '~/logic/useSearch';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    show: Boolean,
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:modelValue': (_modelValue: string) => true,
  },
  setup(props, { emit }) {
    const router = useRouter();
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const show$$q = useVModel(props, 'show', emit);
    const searchQuery$$q = useVModel(props, 'modelValue', emit);

    const debouncedSearchQuery$$q = useDebounce(searchQuery$$q, 200, {
      maxWait: 2000,
    });

    const allSearchResults$$q = useAllSearch()(debouncedSearchQuery$$q);
    const searchResults$$q = computed(() =>
      allSearchResults$$q.value.slice(0, 30)
    );

    const calcHref$$q = (item: AllItem) => {
      switch (item.t) {
        case 'album':
          return `/albums/${item.i.id}`;

        case 'artist':
          return `/artists/${item.i.id}`;

        case 'playlist':
          return `/playlists/${item.i.id}`;

        case 'track':
          return `/albums/${item.i.albumId}`;
      }
    };

    return {
      t,
      show$$q,
      searchQuery$$q,
      searchResults$$q,
      calcHref$$q,
      onSelect$$q: (item: AllItem) => {
        show$$q.value = false;
        searchQuery$$q.value = '';

        if (item.t === 'track') {
          (async () => {
            const tracks$$q = await db.tracks
              .where({ albumId: item.i.albumId })
              .toArray();

            tracks$$q.sort(compareTrack);

            playbackStore.shuffle$$q.value = false;
            playbackStore.setSetListAndPlay$$q(tracks$$q, item.i);
          })();
        }

        router.push(calcHref$$q(item));
      },
    };
  },
});
</script>

<template>
  <n-modal
    v-model:show="show$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <v-card class="w-full md:min-w-2xl p-2">
      <v-text-field
        v-model="searchQuery$$q"
        class="s-v-input-hide-details w-full mb-4"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
      />
      <n-scrollbar class="flex-1 h-[80vh]">
        <v-list>
          <template
            v-for="({ item }, _index) in searchResults$$q"
            :key="_index"
          >
            <router-link
              class="block"
              :to="calcHref$$q(item)"
              @click.prevent="onSelect$$q(item)"
            >
              <v-list-item class="flex gap-x-4" link>
                <v-list-item-avatar
                  icon
                  class="flex-none flex items-center justify-center"
                >
                  <div class="w-10 h-10">
                    <template v-if="item.t === 'track'">
                      <s-album-image
                        class="w-full h-full"
                        size="40"
                        :album="item.i.albumId"
                      />
                    </template>
                    <template v-else-if="item.t === 'album'">
                      <s-album-image
                        class="w-full h-full"
                        size="40"
                        :album="item.i"
                      />
                    </template>
                    <template v-else-if="item.t === 'artist'">
                      <s-artist-image
                        class="w-full h-full"
                        size="40"
                        :artist="item.i"
                      />
                    </template>
                    <template v-else-if="item.t === 'playlist'">
                      <s-playlist-image
                        class="w-full h-full"
                        size="40"
                        :playlist="item.i"
                      />
                    </template>
                  </div>
                </v-list-item-avatar>
                <v-list-item-header>
                  <div class="flex-1 flex flex-col">
                    <div
                      class="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis"
                    >
                      {{ item.l }}
                    </div>
                    <div class="text-xs opacity-60">
                      {{ t(`dialogComponent.search.type.${item.t}`) }}
                    </div>
                  </div>
                </v-list-item-header>
              </v-list-item>
            </router-link>
          </template>
        </v-list>
      </n-scrollbar>
    </v-card>
  </n-modal>
</template>
