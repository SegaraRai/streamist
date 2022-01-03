import { artistImageDelete, artistImageMoveBefore } from '$/services/artists';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await artistImageMoveBefore(
      user.id,
      params.artistId,
      params.imageId,
      body.previousImageId || undefined
    );
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await artistImageDelete(user.id, params.artistId, params.imageId);
    return { status: 204 };
  },
}));
