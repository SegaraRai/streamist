import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { playlistDelete, playlistUpdate } from '$/services/playlists';
import { convertPlaylist } from '$/services/resourceTransformer';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const playlist = await client.playlist.findFirst({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
    });
    if (!playlist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    return {
      status: 200,
      body: convertPlaylist(playlist),
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
  patch: async ({ body, params, user }) => {
    await playlistUpdate(user.id, params.playlistId, body);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
  delete: async ({ params, user }) => {
    await playlistDelete(user.id, params.playlistId);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
}));
