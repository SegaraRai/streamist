import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => {
    const tracks = await client.track.findMany({
      where: {
        userId: user.id,
      },
    });
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: tracks,
    };
  },
}));
