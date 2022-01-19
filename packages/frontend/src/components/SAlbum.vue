<script lang="ts">
import type { PropType } from 'vue';
import { compareTrack } from '$/shared/sort';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { useLiveQuery, useTrackFilter } from '~/composables';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { usePlaybackStore } from '~/stores/playback';
import type { DropdownAlbumInput } from './SDropdownAlbum.vue';

export default defineComponent({
  props: {
    album: {
      type: [String, Object] as PropType<string | ResourceAlbum>,
      required: true,
    },
    linkExcludes: {
      type: Array as PropType<readonly string[]>,
      default: (): string[] => [],
    },
    loading: Boolean,
    setList: {
      type: Array as PropType<readonly ResourceTrack[] | null | undefined>,
      default: undefined,
    },
    setListName: {
      type: String,
      default: undefined,
    },
    visitAlbum: Boolean,
    visitArtist: Boolean,
  },
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const albumId$$q = eagerComputed(() =>
      typeof props.album === 'string' ? props.album : props.album.id
    );

    const propAlbumRef = eagerComputed(() => props.album);
    const { value } = useLiveQuery(
      async () => {
        const propAlbum = propAlbumRef.value;
        const album$$q =
          typeof propAlbum === 'string'
            ? await db.albums.get(propAlbum)
            : propAlbum;
        if (!album$$q) {
          throw new Error(`Album ${propAlbum} not found`);
        }
        const albumId = album$$q.id;
        const artist$$q = await db.artists.get(album$$q.artistId);
        if (!artist$$q) {
          throw new Error(
            `Artist ${album$$q.artistId} not found. (database corrupted)`
          );
        }
        const tracks$$q = await db.tracks.where({ albumId }).toArray();
        tracks$$q.sort(compareTrack);
        if (propAlbumRef.value !== propAlbum) {
          throw new Error('operation aborted');
        }
        emit('trackLoad', tracks$$q);
        return {
          album$$q,
          artist$$q,
          tracks$$q,
        };
      },
      [propAlbumRef],
      true
    );

    const availableTracks = computed(() =>
      value.value?.tracks$$q.filter((track) => isTrackAvailable$$q(track.id))
    );

    const releaseDate = computed(() => {
      return (
        value.value?.tracks$$q
          .map((track) => track.releaseDateText)
          ?.find((x) => x) || null
      );
    });

    const duration = computed(
      () =>
        value.value &&
        formatTracksTotalDuration(
          value.value?.tracks$$q,
          t('vendor.humanizeDuration.language')
        )
    );

    const dropdown$$q = ref<DropdownAlbumInput | undefined>();

    return {
      t,
      albumId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      availableTracks$$q: availableTracks,
      duration$$q: duration,
      releaseDate$$q: releaseDate,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks$$q.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(
          value.value.album$$q.title,
          value.value.tracks$$q
        );
      },
      dropdown$$q,
      openMenu$$q: (target: MouseEvent | HTMLElement) => {
        if (!value.value) {
          return;
        }

        dropdown$$q.value = {
          target$$q: target,
          album$$q: value.value.album$$q,
          tracks$$q: value.value.tracks$$q,
        };
      },
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-6 md:gap-y-4"
    >
      <div class="p-0 m-0 leading-none flex-none">
        <template v-if="linkExcludes.includes(albumId$$q)">
          <s-image-manager
            attach-to-type="album"
            :attach-to-id="albumId$$q"
            :attach-to-title="value$$q.album$$q.title"
            :image-ids="imageIds$$q"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            <template #title>
              {{ t('imageManager.title.album', [value$$q.album$$q.title]) }}
            </template>
            <template #default>
              <s-album-image
                class="w-50 h-50"
                size="200"
                expandable
                :album="albumId$$q"
                @image-ids="imageIds$$q = $event"
              />
            </template>
          </s-image-manager>
        </template>
        <template v-else>
          <router-link :to="`/albums/${albumId$$q}`" class="block">
            <s-album-image
              class="w-50 h-50"
              size="200"
              expandable
              :album="value$$q.album$$q"
              @image-ids="imageIds$$q = $event"
              @contextmenu.prevent="openMenu$$q($event)"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div>
          <div class="flex-none font-bold text-xl line-clamp-2 overflow-hidden">
            <s-conditional-link
              :to="`/albums/${albumId$$q}`"
              :disabled="linkExcludes.includes(albumId$$q)"
              @contextmenu.prevent="openMenu$$q($event)"
            >
              {{ value$$q.album$$q.title }}
            </s-conditional-link>
          </div>
          <div class="s-subheading flex-none line-clamp-2 overflow-hidden">
            <s-conditional-link
              :to="`/artists/${value$$q.artist$$q.id}`"
              :disabled="linkExcludes.includes(value$$q.artist$$q.id)"
            >
              {{ value$$q.artist$$q.name }}
            </s-conditional-link>
          </div>
        </div>
        <div>{{ value$$q?.album$$q.description }}</div>
        <div class="flex-1 <md:hidden"></div>
        <div class="s-subheading flex-none text-sm">
          <span>
            {{ t('album.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <template v-if="value$$q.tracks$$q.length">
            <span>, {{ duration$$q }}</span>
            <template v-if="releaseDate$$q">
              <span class="s-numeric !inline-flex">, {{ releaseDate$$q }}</span>
            </template>
          </template>
        </div>
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <v-btn
        color="primary"
        flat
        icon
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(false)"
      >
        <v-icon>mdi-play</v-icon>
      </v-btn>
      <v-btn
        outlined
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(true)"
      >
        <v-icon left>mdi-shuffle</v-icon>
        <span>
          {{ t('album.Shuffle') }}
        </span>
      </v-btn>
      <button
        class="rounded-full transition-colors"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </button>
      <v-divider />
    </div>
    <s-track-list
      render-mode="virtual"
      :show-album="false"
      :show-artist="false"
      :tracks="value$$q?.tracks$$q"
      :link-excludes="linkExcludes"
      show-disc-number
      index-content="trackNumber"
      :set-list="setList"
      :set-list-name="setListName || value$$q?.album$$q.title"
      :visit-album="visitAlbum"
      :visit-artist="visitArtist"
      show-delete
    />
    <s-dropdown-album v-model="dropdown$$q" />
  </template>
</template>
