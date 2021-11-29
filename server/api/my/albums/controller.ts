import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { generateAlbumId } from '$/utils/id';
import { HTTPError } from '$/utils/httpError';
import { dbAlbumCreate, dbAlbumGetOrCreateByName } from '$/db/album';

export default defineController(() => ({
  get: async ({ user }) => {
    const albums = await client.album.findMany({
      where: {
        userId: user.id,
      },
    });
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
      ? await dbAlbumCreate({
          id: newAlbumId,
          title: body.title,
          userId: user.id,
          artistId: artist.id,
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
