import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const artist = await client.artist.findFirst({
      where: {
        id: params.artistId,
        userId: user.id,
      },
      include: {
        albums:
          !!query?.includeAlbums &&
          (!!query.includeAlbumImages
            ? {
                include: {
                  images: {
                    include: {
                      image: true,
                    },
                  },
                },
              }
            : true),
        tracks:
          !!query?.includeTracks &&
          (!!query?.includeTrackAlbum
            ? {
                include: {
                  album: !!query?.includeTrackAlbumImages
                    ? {
                        include: {
                          images: {
                            include: {
                              image: true,
                            },
                          },
                        },
                      }
                    : true,
                },
              }
            : true),
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
