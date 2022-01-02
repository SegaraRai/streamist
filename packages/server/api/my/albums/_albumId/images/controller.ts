import { dbAlbumGetImages } from '$/db/album';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const images = await dbAlbumGetImages(user.id, params.albumId);
    return {
      status: 200,
      body: images,
    };
  },
}));
