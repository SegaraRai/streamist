<script lang="ts">
import { compareAlbum, compareTrack } from '$shared/sort';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import type { ResourceAlbum } from '$/types';

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

    const propArtistIdRef = computed(() => props.id);
    const { value } = useLiveQuery(
      async () => {
        const artistId = propArtistIdRef.value;
        const artist = await db.artists.get(artistId);
        if (!artist) {
          throw new Error(`Artist ${artistId} not found`);
        }
        const albums = await db.albums.where({ artistId }).toArray();
        const albumMap = new Map<string, ResourceAlbum>(
          albums.map((album) => [album.id, album])
        );
        const albumTracks = (
          await db.tracks
            .where({ albumId: albums.map((album) => album.id) })
            .toArray()
        ).map((track) => ({ ...track, album: albumMap.get(track.albumId)! }));
        const tracks = await db.tracks.where({ artistId }).toArray();
        if (artistId !== propArtistIdRef.value) {
          throw new Error('operation aborted');
        }
        albums.sort(compareAlbum);
        albumTracks.sort(compareTrack);
        tracks.sort(compareTrack);
        const setList = albumTracks;
        playbackStore.setDefaultSetList$$q(setList);
        headTitleRef.value = t('title.Artist', [artist.name]);
        return {
          artist,
          albums,
          albumTracks,
          tracks,
          setList,
        };
      },
      [propArtistIdRef],
      true
    );

    return {
      value$$q: value,
      imageIds$$q: ref<readonly string[] | undefined>(),
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
        <template v-if="value$$q">
          {{ value$$q.artist.name }}
        </template>
      </div>
    </div>
    <v-divider class="mt-8" />
    <template v-if="value$$q">
      <div class="my-12"></div>
      <div class="mb-6">
        <template v-for="album in value$$q.albums" :key="album.id">
          <div class="my-12">
            <s-album
              :album="album"
              :link-excludes="[id]"
              :set-list="value$$q.setList"
            />
          </div>
        </template>
      </div>
    </template>
  </v-container>
</template>
