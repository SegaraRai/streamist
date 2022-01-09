<script lang="ts">
import { db } from '~/db';
import { useLiveQuery } from '~/logic/useLiveQuery';
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

    const playlistId = computed(() => props.id);

    useLiveQuery(
      async () => {
        const id = playlistId.value;

        const playlist$$q = await db.playlists.get(id);
        if (!playlist$$q) {
          tryRedirect(router);
          throw new Error(`Playlist ${id} not found`);
        }
      },
      [playlistId],
      true
    );

    return {
      playlistId$$q: playlistId,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-8 px-6">
    <s-playlist :playlist="playlistId$$q" :link-excludes="[playlistId$$q]" />
  </v-container>
</template>
