import { ImageSortableAlbum, dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { updateUserResourceTimestamp } from '$/db/resource';
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
            images: !!query.includeAlbumImages && {
              include: {
                files: true,
              },
            },
          },
        },
        tracks: !!query?.includeTracks && {
          include: {
            album: !!query.includeTrackAlbum && {
              include: {
                images: !!query.includeTrackAlbumImages && {
                  include: {
                    files: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!artist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    if (query?.includeAlbums && query.includeAlbumImages) {
      for (const album of artist.albums) {
        dbAlbumSortImages(album as unknown as ImageSortableAlbum);
      }
    }
    if (
      query?.includeTracks &&
      query.includeTrackAlbum &&
      query.includeTrackAlbumImages
    ) {
      for (const track of artist.tracks) {
        const { album } = track as unknown as {
          album: ImageSortableAlbum;
        };
        dbAlbumSortImages(album);
      }
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
        updatedAt: Date.now(),
      },
    });
    if (!newArtist) {
      throw new HTTPError(404, `Artist ${params.artistId} not found`);
    }
    await updateUserResourceTimestamp(user.id);
    return { status: 204 };
  },
}));
