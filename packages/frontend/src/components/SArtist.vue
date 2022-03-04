<script lang="ts">
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import { toUnique, toUniqueByProp } from '$shared/unique';
import { compareAlbum, compareCoArtistRole, compareTrack } from '$/shared/sort';
import type { ResourceAlbum, ResourceArtist, ResourceTrack } from '$/types';
import type { DropdownArtistInput } from '~/components/SDropdownArtist.vue';
import { useLiveQuery, useTrackFilter } from '~/composables';
import { db } from '~/db';
import { roleToText } from '~/logic/role';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    artist: {
      type: [String, Object] as PropType<string | ResourceArtist>,
      required: true,
    },
  },
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const artistId$$q = eagerComputed(() =>
      typeof props.artist === 'string' ? props.artist : props.artist.id
    );

    const setList$$q = ref<readonly ResourceTrack[]>([]);
    const filteredSetList$$q = ref<readonly ResourceTrack[]>([]);
    const additionalTracks$$q = ref<readonly ResourceTrack[]>([]);

    let loadedTracksArtistId: string | undefined;
    const loadedTracksMap = new Map<string, readonly ResourceTrack[]>();
    const notLoadedAlbumIdSet = new Set<string>();

    const updateSetList = (
      artist: ResourceArtist,
      albums: readonly ResourceAlbum[],
      tracks: readonly ResourceTrack[]
    ) => {
      if (notLoadedAlbumIdSet.size !== 0) {
        return;
      }

      const setList = albums.flatMap(
        (album$$q) => loadedTracksMap.get(album$$q.id) || []
      );
      const existingTrackIdSet = new Set(setList.map((track) => track.id));
      additionalTracks$$q.value = tracks.filter(
        (track) => !existingTrackIdSet.has(track.id)
      );
      setList.push(...additionalTracks$$q.value);
      playbackStore.setDefaultSetList$$q(
        artist.name,
        setList.map((track) => track.id)
      );
      setList$$q.value = setList;
      filteredSetList$$q.value = setList.filter((track) =>
        isTrackAvailable$$q(track.id)
      );

      emit('trackLoad', setList);
    };

    const propArtistRef = computed(() => props.artist);
    const { value } = useLiveQuery(
      async () => {
        const propArtist = propArtistRef.value;
        const artist$$q =
          typeof propArtist === 'string'
            ? await db.artists.get(propArtist)
            : propArtist;
        if (!artist$$q) {
          throw new Error(`Artist ${propArtist} not found`);
        }
        const artistId = artist$$q.id;
        const albums = await db.albums.where({ artistId }).toArray();
        const tracks = await db.tracks.where({ artistId }).toArray();
        const albumCoArtists = await db.albumCoArtists
          .where({
            artistId,
          })
          .toArray();
        const trackCoArtists = await db.trackCoArtists
          .where({
            artistId,
          })
          .toArray();
        const coArtistAlbums = filterNullAndUndefined(
          await db.albums.bulkGet(albumCoArtists.map((album) => album.albumId))
        );
        const coArtistTracks = filterNullAndUndefined(
          await db.tracks.bulkGet(trackCoArtists.map((track) => track.trackId))
        );
        if (propArtistRef.value !== propArtist) {
          throw new Error('operation aborted');
        }

        albums.sort(compareAlbum);
        tracks.sort(compareTrack);
        coArtistAlbums.sort(compareAlbum);
        coArtistTracks.sort(compareTrack);

        const mergedAlbums = toUniqueByProp(
          [...albums, ...coArtistAlbums],
          'id'
        );
        const mergedTracks = toUniqueByProp(
          [...tracks, ...coArtistTracks],
          'id'
        );

        if (loadedTracksArtistId !== artistId) {
          loadedTracksArtistId = artistId;
          loadedTracksMap.clear();
          for (const album of mergedAlbums) {
            loadedTracksMap.set(album.id, []);
            notLoadedAlbumIdSet.add(album.id);
          }
        }

        updateSetList(artist$$q, mergedAlbums, mergedTracks);

        const roles$$q = toUnique(
          [...albumCoArtists, ...trackCoArtists].map(
            (coArtist) => coArtist.role
          )
        ).sort(compareCoArtistRole);

        return {
          artist$$q,
          albums$$q: mergedAlbums,
          tracks$$q: mergedTracks,
          roles$$q,
        };
      },
      [propArtistRef],
      true
    );

    const strRoles$$q = computed(() =>
      value.value?.roles$$q.map((role) => roleToText(role, t)).join(', ')
    );

    const dropdown$$q = ref<DropdownArtistInput | undefined>();

    return {
      t,
      artistId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      strRoles$$q,
      filteredSetList$$q,
      setList$$q,
      additionalTracks$$q,
      onTrackLoad$$q: (albumId: string, tracks: readonly ResourceTrack[]) => {
        if (!value.value || loadedTracksArtistId !== artistId$$q.value) {
          return;
        }
        loadedTracksMap.set(albumId, tracks);
        notLoadedAlbumIdSet.delete(albumId);
        updateSetList(
          value.value.artist$$q,
          value.value.albums$$q,
          value.value.tracks$$q
        );
      },
      play$$q: (shuffle?: boolean): void => {
        const artist = value.value?.artist$$q;
        if (!artist || !setList$$q.value.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(
          artist.name,
          setList$$q.value.map((track) => track.id)
        );
      },
      playAdditional$$q: (): void => {
        const artist = value.value?.artist$$q;
        if (
          !artist ||
          !setList$$q.value.length ||
          !additionalTracks$$q.value.length
        ) {
          return;
        }
        playbackStore.setSetListAndPlay$$q(
          artist.name,
          setList$$q.value.map((track) => track.id),
          additionalTracks$$q.value[0].id,
          false
        );
      },
      dropdown$$q,
      openMenu$$q: (target: MouseEvent | HTMLElement) => {
        if (!value.value) {
          return;
        }

        dropdown$$q.value = {
          target$$q: target,
          artist$$q: value.value.artist$$q,
        };
      },
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-5"
    >
      <div class="p-0 m-0 leading-none flex-none">
        <SImageManager
          attach-to-type="artist"
          :attach-to-id="artistId$$q"
          :attach-to-title="value$$q?.artist$$q.name"
          :image-ids="imageIds$$q"
          @contextmenu.prevent="openMenu$$q($event)"
        >
          <template #title>
            {{ t('imageManager.title.artist', [value$$q?.artist$$q.name]) }}
          </template>
          <SArtistImage
            class="w-50 h-50"
            size="200"
            expandable
            :artist="artistId$$q"
            @image-ids="imageIds$$q = $event"
          />
        </SImageManager>
      </div>
      <div class="flex flex-col <md:gap-y-3 <md:text-center">
        <div>
          <div class="s-heading font-bold text-xl flex-none line-clamp-2">
            <span @contextmenu.prevent="openMenu$$q($event)">
              {{ value$$q?.artist$$q.name }}
            </span>
          </div>
        </div>
        <template v-if="value$$q?.artist$$q.description">
          <div class="md:my-2">{{ value$$q?.artist$$q.description }}</div>
        </template>
        <div class="flex-1 <md:hidden"></div>
        <template v-if="strRoles$$q">
          <div class="s-subheading-sl">{{ strRoles$$q }}</div>
        </template>
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <VBtn
        color="primary"
        icon
        :disabled="!filteredSetList$$q.length"
        @click="play$$q(false)"
      >
        <VIcon>mdi-play</VIcon>
      </VBtn>
      <VBtn
        outlined
        :disabled="!filteredSetList$$q.length"
        @click="play$$q(true)"
      >
        <VIcon left>mdi-shuffle</VIcon>
        <span>
          {{ t('artist.Shuffle') }}
        </span>
      </VBtn>
      <button
        class="rounded-full transition-colors"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <VIcon>mdi-dots-vertical</VIcon>
      </button>
      <VDivider />
    </div>
    <template v-if="value$$q">
      <template v-if="value$$q.albums$$q.length">
        <div class="mt-4 mb-6">
          <template v-for="album in value$$q.albums$$q" :key="album.id">
            <div class="my-12">
              <SAlbum
                :album="album.id"
                :link-excludes="[artistId$$q]"
                :set-list="setList$$q"
                :set-list-name="value$$q.artist$$q.name"
                visit-album
                @track-load="onTrackLoad$$q(album.id, $event)"
              />
            </div>
          </template>
        </div>
      </template>
      <template v-if="additionalTracks$$q.length">
        <template v-if="value$$q.albums$$q.length">
          <div class="flex-none flex flex-row items-center gap-x-8 mb-4">
            <div class="flex-none text-3xl whitespace-nowrap">
              {{ t('artist.MoreTracks', [value$$q.artist$$q.name]) }}
            </div>
            <!-- v-btn color="primary" flat icon @click="playAdditional$$q()">
              <v-icon>mdi-play</v-icon>
            </v-btn -->
          </div>
        </template>
        <STrackList
          :link-excludes="[artistId$$q]"
          :tracks="additionalTracks$$q"
          :set-list="setList$$q"
          :set-list-name="value$$q.artist$$q.name"
          show-album
          index-content="albumArtwork"
          visit-album
          show-delete
        />
      </template>
    </template>
    <SDropdownArtist v-model="dropdown$$q" />
  </template>
</template>
