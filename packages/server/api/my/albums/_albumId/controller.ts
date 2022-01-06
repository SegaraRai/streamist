import { client } from '$/db/lib/client';
import { albumUpdate } from '$/services/albums';
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
  patch: async ({ body, params, user }) => {
    await albumUpdate(user.id, params.albumId, body.title);
    return { status: 204 };
  },
}));
