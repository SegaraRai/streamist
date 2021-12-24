<script lang="ts">
import { compareTrack } from '$shared/sort';
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const headTitleRef = ref(t('title.AlbumInit'));
    useHead({
      title: headTitleRef,
    });

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q();
    });

    const propAlbumIdRef = computed(() => props.id);
    const { value } = useLiveQuery(
      async () => {
        const albumId = propAlbumIdRef.value;
        const album = await db.albums.get(albumId);
        if (!album) {
          throw new Error(`Album ${albumId} not found`);
        }
        const artist = await db.artists.get(album.artistId);
        if (!artist) {
          throw new Error(`Artist ${album.artistId} not found`);
        }
        const tracks = await db.tracks.where({ albumId }).toArray();
        if (albumId !== propAlbumIdRef.value) {
          throw new Error('operation aborted');
        }
        tracks.sort(compareTrack);
        const setList = tracks;
        playbackStore.setDefaultSetList$$q(setList);
        tracks.sort(compareTrack);
        headTitleRef.value = t('title.Album', [album.title, artist.name]);
        return {
          album,
          artist,
          tracks,
          setList,
        };
      },
      [propAlbumIdRef],
      true
    );

    return {
      value$$q: value,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-8 px-6">
    <template v-if="value$$q">
      <s-album
        :album="value$$q.album"
        :link-excludes="[id]"
        :set-list="value$$q.setList"
      />
    </template>
  </v-container>
</template>
