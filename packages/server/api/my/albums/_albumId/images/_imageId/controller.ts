import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { albumImageDelete, albumImageMoveBefore } from '$/services/albums';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await albumImageMoveBefore(
      user.id,
      params.albumId,
      params.imageId,
      body.nextImageId || undefined
    );
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
  delete: async ({ params, user }) => {
    await albumImageDelete(user.id, params.albumId, params.imageId);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
}));
