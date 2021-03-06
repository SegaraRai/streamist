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
    skipSetListCheck: Boolean,
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

    const albumId$$q = computedEager(() =>
      typeof props.album === 'string' ? props.album : props.album.id
    );

    const propAlbumRef = computedEager(() => props.album);
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
          value.value.tracks$$q.map((track) => track.id)
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
      class="mb-6 <md:mt-4 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-5"
    >
      <div class="p-0 m-0 leading-none flex-none">
        <template v-if="linkExcludes.includes(albumId$$q)">
          <SImageManager
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
              <SAlbumImage
                class="w-50 h-50"
                size="200"
                expandable
                :album="albumId$$q"
                @image-ids="imageIds$$q = $event"
              />
            </template>
          </SImageManager>
        </template>
        <template v-else>
          <RouterLink :to="`/albums/${albumId$$q}`" class="block">
            <SAlbumImage
              class="w-50 h-50"
              size="200"
              expandable
              :album="value$$q.album$$q"
              @image-ids="imageIds$$q = $event"
              @contextmenu.prevent="openMenu$$q($event)"
            />
          </RouterLink>
        </template>
      </div>
      <div class="flex flex-col <md:gap-y-3 <md:text-center">
        <div>
          <div class="s-heading font-bold text-xl flex-none line-clamp-2">
            <SConditionalLink
              :to="`/albums/${albumId$$q}`"
              :disabled="linkExcludes.includes(albumId$$q)"
              @contextmenu.prevent="openMenu$$q($event)"
            >
              {{ value$$q.album$$q.title }}
            </SConditionalLink>
          </div>
          <div class="s-subheading flex-none line-clamp-2">
            <SConditionalLink
              :to="`/artists/${value$$q.artist$$q.id}`"
              :disabled="linkExcludes.includes(value$$q.artist$$q.id)"
            >
              {{ value$$q.artist$$q.name }}
            </SConditionalLink>
          </div>
        </div>
        <template v-if="value$$q?.album$$q.description">
          <div class="md:my-2">{{ value$$q?.album$$q.description }}</div>
        </template>
        <div class="flex-1 <md:hidden"></div>
        <div class="s-subheading-sl flex-none text-sm">
          <span>
            {{ t('album.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <template v-if="value$$q.tracks$$q.length">
            <span>, {{ duration$$q }}</span>
            <template v-if="releaseDate$$q">
              <span>, {{ releaseDate$$q }}</span>
            </template>
          </template>
        </div>
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <VBtn
        color="primary"
        icon
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(false)"
      >
        <i-mdi-play />
      </VBtn>
      <VBtn
        outlined
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(true)"
      >
        <i-mdi-shuffle />
        <span class="pl-1">
          {{ t('album.Shuffle') }}
        </span>
      </VBtn>
      <button
        class="rounded-full transition-colors flex items-center"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <i-mdi-dots-vertical />
      </button>
      <VDivider />
    </div>
    <STrackList
      render-mode="virtual"
      :show-album="false"
      :show-artist="false"
      :tracks="value$$q?.tracks$$q"
      :link-excludes="linkExcludes"
      show-disc-number
      index-content="trackNumber"
      :set-list="setList"
      :set-list-name="setListName || value$$q?.album$$q.title"
      :skip-set-list-check="skipSetListCheck"
      :visit-album="visitAlbum"
      :visit-artist="visitArtist"
      show-delete
    />
    <SDropdownAlbum v-model="dropdown$$q" />
  </template>
</template>
