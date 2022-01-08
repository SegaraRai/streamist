import { client } from '$/db/lib/client';
import { albumMerge, albumUpdate } from '$/services/albums';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const album = await client.album.findFirst({
      where: {
        id: params.albumId,
        userId: user.id,
      },
    });
    if (!album) {
      throw new HTTPError(404, `Album ${params.albumId} not found`);
    }
    return {
      status: 200,
      body: album,
    };
  },
  patch: async ({ body, params, query, user }) => {
    await albumUpdate(user.id, params.albumId, body, {
      forceNewArtist: !!query?.forceNewArtist,
    });
    return { status: 204 };
  },
  post: async ({ body, params, user }) => {
    await albumMerge(user.id, params.albumId, body.toAlbumId);
    return { status: 204 };
  },
}));
