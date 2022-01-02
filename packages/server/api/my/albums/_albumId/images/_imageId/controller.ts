import { dbAlbumMoveImageBefore } from '$/db/album';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { albumRemoveImages } from '$/services/albums';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await dbAlbumMoveImageBefore(
      user.id,
      params.albumId,
      params.imageId,
      body.previousImageId || undefined
    ).catch((error) => Promise.reject(new HTTPError(400, String(error))));
    await dbResourceUpdateTimestamp(user.id);
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await albumRemoveImages(user.id, params.albumId, params.imageId);
    return { status: 204 };
  },
}));
