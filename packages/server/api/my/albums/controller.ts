import { generateAlbumId } from '$shared-server/generateId';
import { dbAlbumGetOrCreateByName, dbAlbumSortImages } from '$/db/album';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ query, user }) => {
    const albums = await client.album.findMany({
      where: {
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
    if (query?.includeAlbumImages) {
      for (const album of albums) {
        dbAlbumSortImages(album);
      }
    }
    return { status: 200, body: albums };
  },
  post: async ({ body, query, user }) => {
    const newAlbumId = await generateAlbumId();

    const artist = await client.artist.findFirst({
      where: {
        id: body.artistId,
        userId: user.id,
      },
    });
    if (!artist) {
      throw new HTTPError(400, `Artist ${body.artistId} not found`);
    }

    const album = query?.forceNewAlbum
      ? await client.album.create({
          data: {
            id: newAlbumId,
            title: body.title,
            userId: user.id,
            artistId: artist.id,
          },
        })
      : await dbAlbumGetOrCreateByName(
          user.id,
          artist.id,
          body.title,
          newAlbumId
        );

    return {
      status: album.id === newAlbumId ? 201 : 200,
      body: album,
    };
  },
}));
