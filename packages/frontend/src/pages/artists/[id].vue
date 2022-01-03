<script lang="ts">
import { compareAlbum, compareTrack } from '$shared/sort';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import type { ResourceAlbum, ResourceTrack } from '$/types';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
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

    return {
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
    };
  },
});
</script>

<template>
  <v-container fluid>
    <div class="flex gap-4 <md:flex-col <md:items-center">
      <s-image-manager
        attach-to-type="artist"
        :attach-to-id="id"
        :attach-to-title="value$$q?.artist$$q.name"
        :image-ids="imageIds$$q"
        rounded
      >
        <s-artist-image
          class="w-50 h-50"
          size="200"
          :artist="id"
          @image-ids="imageIds$$q = $event"
        />
      </s-image-manager>
      <div class="text-2xl <md:flex-1 max-w-4xl">
        {{ value$$q?.artist$$q.name }}
      </div>
    </div>
    <v-divider class="mt-8" />
    <template v-if="value$$q">
      <div class="h-12"></div>
      <template v-if="value$$q.albums$$q.length">
        <div class="mb-6">
          <template v-for="album in value$$q.albums$$q" :key="album.id">
            <div class="my-12">
              <s-album
                :album="album"
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
          <v-divider />
          <div class="h-12"></div>
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
  </v-container>
</template>
