import { dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { albumUpdate } from '$/services/albums';
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
        images: !!query?.includeAlbumImages,
        tracks: !!query?.includeTracks && {
          include: {
            artist: !!query.includeTrackArtist,
          },
        },
      },
    });
    if (!album) {
      throw new HTTPError(404, `Album ${params.albumId} not found`);
    }
    if (query?.includeAlbumImages) {
      dbAlbumSortImages(album);
    }
    return {
      status: 200,
      body: album,
    };
  },
  patch: async ({ body, params, user }) => {
    await albumUpdate(user.id, params.albumId, body.title);
    return { status: 204 };
  },
}));
