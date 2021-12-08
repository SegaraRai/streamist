import { dbAlbumMoveImageBefore, dbAlbumRemoveImage } from '$/db/album';
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
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await dbAlbumRemoveImage(user.id, params.albumId, params.imageId).catch(
      (error) => Promise.reject(new HTTPError(404, String(error)))
    );
    return { status: 204 };
  },
}));
