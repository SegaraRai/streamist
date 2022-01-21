<route lang="yaml">
meta:
  layout: app
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

    const headTitleRef = ref(t('title.ArtistInit'));
    useHead({
      title: headTitleRef,
    });

    onBeforeUnmount(() => {
      playbackStore.clearDefaultSetList$$q();
    });

    const propArtistIdRef = computed(() => props.id);
    const { value, valueAsync } = useLiveQuery(
      async () => {
        const artistId = propArtistIdRef.value;
        const artist$$q = await db.artists.get(artistId);
        if (!artist$$q) {
          tryRedirect(router);
          throw new Error(`Artist ${artistId} not found`);
        }
        headTitleRef.value = t('title.Artist', [artist$$q.name]);
        return {
          artist$$q,
        };
      },
      [propArtistIdRef],
      true
    );

    const setList$$q = ref<readonly ResourceTrack[]>([]);

    return {
      value$$q: value,
      setList$$q,
      onTrackLoad$$q: (tracks: readonly ResourceTrack[]) => {
        valueAsync.value.then((v) => {
          playbackStore.setDefaultSetList$$q(v.artist$$q.name, tracks);
        });
        setList$$q.value = tracks;
      },
    };
  },
});
</script>

<template>
  <VContainer fluid>
    <SArtist :artist="id" @track-load="onTrackLoad$$q" />
  </VContainer>
</template>
