import { client } from '$/db/lib/client';
import { deleteAlbum, updateAlbum } from '$/services/albums';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const album = await client.album.findFirst({
      where: {
        id: params.albumId,
        userId: user.id,
      },
      include: {
        artist: !!query?.includeAlbumArtist,
        images: !!query?.includeAlbumImages && {
          include: {
            image: true,
          },
        },
        tracks:
          !!query?.includeTracks &&
          (query.includeTrackArtist
            ? {
                include: {
                  artist: true,
                },
              }
            : true),
      },
    });
    if (!album) {
      throw new HTTPError(404, `Album ${params.albumId} not found`);
    }
    return {
      status: 200,
      body: album,
    };
  },
  patch: async ({ body, params, user }) => {
    await updateAlbum(user.id, params.albumId, body.title);
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await deleteAlbum(user.id, params.albumId);
    return { status: 204 };
  },
}));
