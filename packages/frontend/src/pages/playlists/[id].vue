<script lang="ts">
import type { ResourceTrack } from '$/types';
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
  <v-container fluid class="pt-8 px-6">
    <s-playlist
      :playlist="id"
      :link-excludes="[id]"
      @track-load="onTrackLoad$$q"
    />
  </v-container>
</template>
