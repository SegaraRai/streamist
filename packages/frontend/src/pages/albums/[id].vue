<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<script lang="ts">
import type { ResourceTrack } from '$/types';
import { useLiveQuery } from '~/composables';
import { db } from '~/db';
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
    const playbackStore = usePlaybackStore();

    const headTitleRef = ref(t('title.AlbumInit'));
    useHead({
      title: headTitleRef,
    });

    onBeforeUnmount(() => {
      playbackStore.clearDefaultSetList$$q();
    });

    const propAlbumIdRef = computed(() => props.id);
    const { value, valueAsync } = useLiveQuery(
      async () => {
        const albumId = propAlbumIdRef.value;
        const album$$q = await db.albums.get(albumId);
        if (!album$$q) {
          tryRedirect(router);
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
        valueAsync.value.then((v) => {
          playbackStore.setDefaultSetList$$q(v.album$$q.title, tracks);
        });
        setList$$q.value = tracks;
      },
    };
  },
});
</script>

<template>
  <VContainer fluid>
    <SAlbum
      :album="id"
      :link-excludes="[id]"
      :set-list="setList$$q"
      :set-list-name="value$$q?.album$$q.title"
      visit-artist
      @track-load="onTrackLoad$$q"
    />
  </VContainer>
</template>
