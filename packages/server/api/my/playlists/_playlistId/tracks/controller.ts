import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { dbPlaylistGetTracks } from '$/db/playlist';
import { playlistTrackAdd } from '$/services/playlists';
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
    const tracks = await dbPlaylistGetTracks(user.id, params.playlistId);
    return {
      status: 200,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
      body: tracks,
    };
  },
  post: async ({ body, params, user }) => {
    await playlistTrackAdd(user.id, params.playlistId, body.trackIds);
    return {
      status: 201,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
        Location: body.trackIds.map(
          (trackId): string =>
            `/api/my/playlists/${params.playlistId}/tracks/${trackId}`
        ),
      },
    };
  },
}));
