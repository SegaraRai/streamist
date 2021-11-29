import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { dbPlaylistAddTrackTx, dbPlaylistGetTracks } from '$/db/playlist';
import { HTTPError } from '$/utils/httpError';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const tracks = await dbPlaylistGetTracks(user.id, params.playlistId);
    return {
      status: 200,
      body: tracks,
    };
  },
  post: async ({ body, params, user }) => {
    await client.$transaction(async (txClient) => {
      const track = await txClient.track.findFirst({
        where: {
          id: body.trackId,
          userId: user.id,
        },
      });
      if (!track) {
        throw new HTTPError(400, `Track ${body.trackId} not found`);
      }

      await dbPlaylistAddTrackTx(
        txClient,
        user.id,
        params.playlistId,
        track.id
      );
    });
    return { status: 204 };
  },
}));
