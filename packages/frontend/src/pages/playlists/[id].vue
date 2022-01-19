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
    const playbackStore = usePlaybackStore();

    onBeforeUnmount(() => {
      playbackStore.clearDefaultSetList$$q();
    });

    const propPlaylistIdRef = computed(() => props.id);
    const { valueAsync } = useLiveQuery(
      async () => {
        const playlistId = propPlaylistIdRef.value;
        const playlist$$q = await db.playlists.get(playlistId);
        if (!playlist$$q) {
          tryRedirect(router);
          throw new Error(`Playlist ${playlistId} not found`);
        }
        return {
          playlist$$q,
        };
      },
      [propPlaylistIdRef],
      true
    );

    return {
      onTrackLoad$$q: (tracks: readonly ResourceTrack[]) => {
        valueAsync.value.then((v) => {
          playbackStore.setDefaultSetList$$q(v.playlist$$q.title, tracks);
        });
      },
    };
  },
});
</script>

<template>
  <v-container fluid>
    <s-playlist
      :playlist="id"
      :link-excludes="[id]"
      @track-load="onTrackLoad$$q"
    />
  </v-container>
</template>
