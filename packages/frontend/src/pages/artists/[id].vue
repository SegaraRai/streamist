<script lang="ts">
import { compareAlbum, compareTrack } from '$shared/sort';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import type { DropdownArtistInput } from '~/components/SDropdownArtist.vue';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import { tryRedirect } from '~/stores/redirect';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();

    const headTitleRef = ref(t('title.ArtistInit'));
    useHead({
      title: headTitleRef,
    });

    const playbackStore = usePlaybackStore();

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q();
    });

    let loadedTracksArtistId: string | undefined;
    const loadedTracksMap = new Map<string, readonly ResourceTrack[]>();
    const notLoadedAlbumIdSet = new Set<string>();

    const updateSetList = (
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
      playbackStore.setDefaultSetList$$q(setList);
      setList$$q.value = setList;
    };

    const propArtistIdRef = computed(() => props.id);
    const { value } = useLiveQuery(
      async () => {
        const artistId = propArtistIdRef.value;
        const artist$$q = await db.artists.get(artistId);
        if (!artist$$q) {
          tryRedirect(router);
          throw new Error(`Artist ${artistId} not found`);
        }
        const albums$$q = await db.albums.where({ artistId }).toArray();
        const tracks$$q = await db.tracks.where({ artistId }).toArray();
        if (artistId !== propArtistIdRef.value) {
          throw new Error('operation aborted');
        }

        if (loadedTracksArtistId !== artistId) {
          loadedTracksArtistId = artistId;
          loadedTracksMap.clear();
          for (const album of albums$$q) {
            loadedTracksMap.set(album.id, []);
            notLoadedAlbumIdSet.add(album.id);
          }
        }

        albums$$q.sort(compareAlbum);
        tracks$$q.sort(compareTrack);

        headTitleRef.value = t('title.Artist', [artist$$q.name]);

        updateSetList(albums$$q, tracks$$q);

        return {
          artist$$q,
          albums$$q,
          tracks$$q,
        };
      },
      [propArtistIdRef],
      true
    );

    const setList$$q = ref<readonly ResourceTrack[]>([]);
    const additionalTracks$$q = ref<readonly ResourceTrack[]>([]);

    const dropdown$$q = ref<DropdownArtistInput | undefined>();

    return {
      t,
      setList$$q,
      additionalTracks$$q,
      value$$q: value,
      imageIds$$q: ref<readonly string[] | undefined>(),
      onTrackLoad$$q: (albumId: string, tracks: readonly ResourceTrack[]) => {
        if (!value.value || loadedTracksArtistId !== propArtistIdRef.value) {
          return;
        }
        loadedTracksMap.set(albumId, tracks);
        notLoadedAlbumIdSet.delete(albumId);
        updateSetList(value.value.albums$$q, value.value.tracks$$q);
      },
      play$$q: (shuffle?: boolean): void => {
        if (!setList$$q.value.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(setList$$q.value);
      },
      playAdditional$$q: (): void => {
        if (!setList$$q.value.length || !additionalTracks$$q.value.length) {
          return;
        }
        playbackStore.shuffle$$q.value = false;
        playbackStore.setSetListAndPlay$$q(
          setList$$q.value,
          additionalTracks$$q.value[0]
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
  <v-container fluid>
    <div class="flex gap-4 <md:flex-col <md:items-center">
      <div class="p-0 m-0 leading-none flex-none">
        <s-image-manager
          attach-to-type="artist"
          :attach-to-id="id"
          :attach-to-title="value$$q?.artist$$q.name"
          :image-ids="imageIds$$q"
          @contextmenu.prevent="openMenu$$q($event)"
        >
          <s-artist-image
            class="w-50 h-50"
            size="200"
            :artist="id"
            @image-ids="imageIds$$q = $event"
          />
        </s-image-manager>
      </div>
      <div
        class="text-2xl <md:flex-1 max-w-4xl line-clamp-2 overflow-hidden"
        @contextmenu.prevent="openMenu$$q($event)"
      >
        {{ value$$q?.artist$$q.name }}
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <v-btn
        color="primary"
        flat
        icon
        :disabled="!setList$$q.length"
        @click="play$$q(false)"
      >
        <v-icon>mdi-play</v-icon>
      </v-btn>
      <v-btn outlined :disabled="!setList$$q.length" @click="play$$q(true)">
        <v-icon left>mdi-shuffle</v-icon>
        <span>
          {{ t('artist.Shuffle') }}
        </span>
      </v-btn>
      <button
        class="rounded-full"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </button>
      <v-divider />
    </div>
    <template v-if="value$$q">
      <div class="h-4"></div>
      <template v-if="value$$q.albums$$q.length">
        <div class="mb-6">
          <template v-for="album in value$$q.albums$$q" :key="album.id">
            <div class="my-12">
              <s-album
                :album="album.id"
                :link-excludes="[id]"
                :set-list="setList$$q"
                visit-album
                @track-load="onTrackLoad$$q(album.id, $event)"
              />
            </div>
          </template>
        </div>
      </template>
      <template v-if="additionalTracks$$q.length">
        <template v-if="value$$q.albums$$q.length">
          <div class="flex-none flex flex-row items-center gap-x-8 my-8">
            <div class="flex-none text-3xl whitespace-nowrap">
              {{ t('artist.MoreTracks') }}
            </div>
            <!-- v-btn color="primary" flat icon @click="playAdditional$$q()">
              <v-icon>mdi-play</v-icon>
            </v-btn -->
            <v-divider />
          </div>
        </template>
        <s-track-list
          :link-excludes="[id]"
          :tracks="additionalTracks$$q"
          :set-list="setList$$q"
          show-album
          index-content="albumArtwork"
          visit-album
        />
      </template>
    </template>
    <s-dropdown-artist v-model="dropdown$$q" />
  </v-container>
</template>
