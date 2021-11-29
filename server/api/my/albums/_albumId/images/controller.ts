import { defineController } from './$relay';
import { dbAlbumAddImageTx, dbAlbumGetImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const images = await dbAlbumGetImages(user.id, params.albumId);
    return {
      status: 200,
      body: images,
    };
  },
  post: async ({ body, params, user }) => {
    await client.$transaction(async (txClient) => {
      const image = await txClient.image.findFirst({
        where: {
          id: body.imageId,
          userId: user.id,
        },
      });
      if (!image) {
        throw new HTTPError(400, `Image ${body.imageId} not found`);
      }

      await dbAlbumAddImageTx(txClient, user.id, params.albumId, image.id);
    });
    return { status: 204 };
  },
}));
