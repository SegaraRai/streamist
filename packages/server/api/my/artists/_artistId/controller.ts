import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { artistMerge, artistUpdate } from '$/services/artists';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const artist = await client.artist.findFirst({
      where: {
        id: params.artistId,
        userId: user.id,
      },
    });
    if (!artist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: artist,
    };
  },
  patch: async ({ body, params, user }) => {
    await artistUpdate(user.id, params.artistId, body);
    return {
      status: 204,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
  post: async ({ body, params, user }) => {
    await artistMerge(user.id, params.artistId, body.toArtistId);
    return {
      status: 204,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
}));
