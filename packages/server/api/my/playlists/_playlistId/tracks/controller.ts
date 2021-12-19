import { client } from '$/db/lib/client';
import { dbPlaylistAddTrack, dbPlaylistSortTracks } from '$/db/playlist';
import { updateUserResourceTimestamp } from '$/db/resource';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const playlist = await client.playlist.findFirst({
      where: {
        id: params.playlistId,
        userId: user.id,
      },
      include: {
        tracks: true,
      },
    });
    if (!playlist) {
      throw new HTTPError(404, `Playlist ${params.playlistId} not found`);
    }
    dbPlaylistSortTracks(playlist);
    return {
      status: 200,
      body: playlist.tracks,
    };
  },
  post: async ({ body, params, user }) => {
    await dbPlaylistAddTrack(user.id, params.playlistId, body.trackId);
    await updateUserResourceTimestamp(user.id);
    return {
      status: 201,
      headers: {
        Location: `/api/my/playlists/${params.playlistId}/tracks/${body.trackId}`,
      },
    };
  },
}));
