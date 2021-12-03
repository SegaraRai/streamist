import { defineController } from './$relay';
import { client } from '$/db/lib/client';

export default defineController(() => ({
  get: async ({ user }) => {
    const tracks = await client.track.findMany({
      where: {
        userId: user.id,
      },
    });
    return { status: 200, body: tracks };
  },
}));
