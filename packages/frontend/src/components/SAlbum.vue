<script lang="ts">
import type { PropType } from 'vue';
import { compareTrack } from '$shared/sort';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { useMenu } from '~/logic/menu';
import { createAlbumDropdown } from '~/logic/naive-ui/albumDropdown';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';

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
    visitAlbum: Boolean,
    visitArtist: Boolean,
  },
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

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
        const artist$$q = await db.artists.get(album$$q.artistId);
        if (!artist$$q) {
          throw new Error(
            `Artist ${album$$q.artistId} not found. (database corrupted)`
          );
        }
        const tracks$$q = await db.tracks
          .where({ albumId: album$$q.id })
          .toArray();
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

    const releaseDate = computed(() => {
      return (
        value.value?.tracks$$q
          .map((track) => track.releaseDateText)
          ?.find((x) => x) || null
      );
    });

    const duration = computed(
      () => value.value && formatTracksTotalDuration(value.value?.tracks$$q)
    );

    const dialog$$q = ref(false);

    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
    });
    const menuOptions$$q = createAlbumDropdown({
      album$$q: eagerComputed(() => value.value?.album$$q),
      albumTracks$$q: eagerComputed(() => value.value?.tracks$$q),
      openEditAlbumDialog$$q: () => {
        dialog$$q.value = true;
      },
      closeMenu$$q,
    });

    return {
      t,
      albumId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      duration$$q: duration,
      releaseDate$$q: releaseDate,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks$$q.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(value.value.tracks$$q);
      },
      dialog$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      openMenu$$q,
      closeMenu$$q,
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-6 md:gap-y-4"
    >
      <div class="p-0 m-0 leading-none">
        <template v-if="linkExcludes.includes(albumId$$q)">
          <s-image-manager
            attach-to-type="album"
            :attach-to-id="albumId$$q"
            :attach-to-title="value$$q.album$$q.title"
            :image-ids="imageIds$$q"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            <template #title
              >Album Art of {{ value$$q.album$$q.title }}</template
            >
            <template #default>
              <s-album-image
                class="w-50 h-50"
                size="200"
                :album="value$$q.album$$q"
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
              :album="value$$q.album$$q"
              @image-ids="imageIds$$q = $event"
              @contextmenu.prevent="openMenu$$q($event)"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div>
          <div class="flex-none font-bold text-xl">
            <s-conditional-link
              :to="`/albums/${albumId$$q}`"
              :disabled="linkExcludes.includes(albumId$$q)"
              @contextmenu.prevent="openMenu$$q($event)"
            >
              {{ value$$q.album$$q.title }}
            </s-conditional-link>
          </div>
          <div class="flex-none">
            <s-conditional-link
              :to="`/artists/${value$$q.artist$$q.id}`"
              :disabled="linkExcludes.includes(value$$q.artist$$q.id)"
            >
              {{ value$$q.artist$$q.name }}
            </s-conditional-link>
          </div>
        </div>
        <div class="flex-1 <md:hidden"></div>
        <div class="flex-none flex flex-row gap-x-8">
          <v-btn
            color="primary"
            :disabled="!value$$q.tracks$$q.length"
            @click="play$$q(false)"
          >
            <v-icon left>mdi-play</v-icon>
            <span>
              {{ t('album.Play') }}
            </span>
          </v-btn>
          <v-btn
            color="accent"
            outlined
            :disabled="!value$$q.tracks$$q.length"
            @click="play$$q(true)"
          >
            <v-icon left>mdi-shuffle</v-icon>
            <span>
              {{ t('album.Shuffle') }}
            </span>
          </v-btn>
        </div>
        <div class="flex-none text-sm">
          <span>
            {{ t('album.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <template v-if="value$$q.tracks$$q.length">
            <span v-show="duration$$q">, {{ duration$$q }}</span>
            <span v-show="releaseDate$$q">, {{ releaseDate$$q }}</span>
          </template>
        </div>
      </div>
    </div>
  </template>
  <s-track-list
    render-mode="plain"
    :show-album="false"
    :show-artist="false"
    :tracks="value$$q?.tracks$$q"
    :link-excludes="linkExcludes"
    show-disc-number
    index-content="trackNumber"
    :set-list="setList"
    :visit-album="visitAlbum"
    :visit-artist="visitArtist"
  />
  <template v-if="value$$q">
    <n-dropdown
      class="select-none"
      placement="bottom-start"
      trigger="manual"
      :x="menuX$$q"
      :y="menuY$$q"
      :options="menuOptions$$q"
      :show="menuIsOpen$$q"
      :on-clickoutside="closeMenu$$q"
      @contextmenu.prevent
    />
    <s-dialog-album-edit v-model="dialog$$q" :album="value$$q.album$$q" />
  </template>
</template>
