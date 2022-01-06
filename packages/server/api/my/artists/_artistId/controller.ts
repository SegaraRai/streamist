import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
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
      body: artist,
    };
  },
  patch: async ({ body, params, user }) => {
    const newArtist = await client.artist.updateMany({
      where: {
        id: params.artistId,
        userId: user.id,
      },
      data: {
        name: body.name,
        updatedAt: Date.now(),
      },
    });
    if (!newArtist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    await dbResourceUpdateTimestamp(user.id);
    return { status: 204 };
  },
}));
