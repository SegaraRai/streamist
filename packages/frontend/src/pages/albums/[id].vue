<script lang="ts">
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import type { ResourceTrack } from '$/types';

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
        const album$$q = await db.albums.get(albumId);
        if (!album$$q) {
          throw new Error(`Album ${albumId} not found`);
        }
        const artist$$q = await db.artists.get(album$$q.artistId);
        if (!artist$$q) {
          throw new Error(`Artist ${album$$q.artistId} not found`);
        }
        if (albumId !== propAlbumIdRef.value) {
          throw new Error('operation aborted');
        }
        headTitleRef.value = t('title.Album', [album$$q.title, artist$$q.name]);
        return {
          album$$q,
        };
      },
      [propAlbumIdRef],
      true
    );

    const setList$$q = ref<readonly ResourceTrack[]>([]);

    return {
      value$$q: value,
      setList$$q,
      onTrackLoad$$q: (tracks: readonly ResourceTrack[]) => {
        playbackStore.setDefaultSetList$$q(tracks);
        setList$$q.value = tracks;
      },
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-8 px-6">
    <template v-if="value$$q">
      <s-album
        :album="value$$q.album$$q"
        :link-excludes="[id]"
        :set-list="setList$$q"
        @track-load="onTrackLoad$$q"
      />
    </template>
  </v-container>
</template>
