import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const artist = await client.artist.findFirst({
      where: {
        id: params.artistId,
        userId: user.id,
      },
      include: {
        albums: !!query?.includeAlbums && {
          include: {
            images: !!query.includeAlbumImages,
          },
        },
        tracks: !!query?.includeTracks && {
          include: {
            album: !!query?.includeTrackAlbum && {
              include: {
                images: !!query?.includeTrackAlbumImages,
              },
            },
          },
        },
      },
    });
    if (!artist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    return {
      status: 200,
      body: artist,
    };
  },
  patch: async ({ body, params, user }) => {
    const newArtist = await client.artist.updateMany({
      where: {
        id: params.artistId,
        userId: user.id,
      },
      data: {
        name: body.name,
      },
    });
    if (!newArtist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    return { status: 204 };
  },
}));
