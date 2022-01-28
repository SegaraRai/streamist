import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { playlistCreate } from '$/services/playlists';
import { convertPlaylist } from '$/services/resourceTransformer';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => {
    const playlists = await client.playlist.findMany({
      where: {
        userId: user.id,
      },
    });
    return { status: 200, body: playlists.map(convertPlaylist) };
  },
  post: async ({ body, user }) => {
    const playlist = await playlistCreate(user.id, body);
    return {
      status: 201,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
        Location: `/api/my/playlists/${playlist.id}`,
      },
      body: convertPlaylist(playlist),
    };
  },
}));
