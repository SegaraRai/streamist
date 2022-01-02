import { dbAlbumAddImage, dbAlbumGetImages } from '$/db/album';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const images = await dbAlbumGetImages(user.id, params.albumId, true);
    return {
      status: 200,
      body: images,
    };
  },
  post: async ({ body, params, user }) => {
    await dbAlbumAddImage(user.id, params.albumId, body.imageId);
    await dbResourceUpdateTimestamp(user.id);
    return {
      status: 201,
      headers: {
        Location: `/api/my/albums/${params.albumId}/images/${body.imageId}`,
      },
    };
  },
}));
