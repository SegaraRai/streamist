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
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await albumImageDelete(user.id, params.albumId, params.imageId);
    return { status: 204 };
  },
}));
