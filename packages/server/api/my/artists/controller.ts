import { client } from '$/db/lib/client';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => {
    const artists = await client.artist.findMany({
      where: {
        userId: user.id,
      },
    });
    return { status: 200, body: artists };
  },
}));
