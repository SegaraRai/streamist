import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { trackDelete, trackUpdate } from '$/services/tracks';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const track = await client.track.findFirst({
      where: {
        id: params.trackId,
        userId: user.id,
      },
    });
    if (!track) {
      throw new HTTPError(404, `track ${params.trackId} not found`);
    }
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: track,
    };
  },
  patch: async ({ body, params, query, user }) => {
    const newTrack = await trackUpdate(user.id, params.trackId, body, {
      forceNewAlbum: !!query?.forceNewAlbum,
      forceNewArtist: !!query?.forceNewArtist,
      preferAlbumArtist: !!query?.preferAlbumArtist,
      preferOldArtist: !!query?.preferOldArtist,
    });
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: newTrack,
    };
  },
  delete: async ({ params, user }) => {
    await trackDelete(user.id, params.trackId, true);
    return {
      status: 204,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
}));
