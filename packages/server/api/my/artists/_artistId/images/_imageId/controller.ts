import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { artistImageDelete, artistImageMoveBefore } from '$/services/artists';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await artistImageMoveBefore(
      user.id,
      params.artistId,
      params.imageId,
      body.nextImageId || undefined
    );
    return {
      status: 204,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
  delete: async ({ params, user }) => {
    await artistImageDelete(user.id, params.artistId, params.imageId);
    return {
      status: 204,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
}));
