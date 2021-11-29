import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { dbAlbumGetOrCreateByNameTx } from '$/db/album';
import { generateAlbumId, generateArtistId } from '$/utils/id';
import { dbArtistGetOrCreateByNameTx } from '$/db/artist';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const track = await client.track.findFirst({
      where: {
        id: params.trackId,
        userId: user.id,
      },
      include: {
        artist: !!query?.includeTrackArtist,
        album: !!query?.includeAlbum
          ? {
              include: {
                artist: !!query?.includeAlbumArtist,
                images: !!query?.includeAlbumImages
                  ? {
                      include: {
                        image: true,
                      },
                    }
                  : false,
              },
            }
          : false,
      },
    });
    if (!track) {
      throw new HTTPError(404, `track ${params.trackId} not found`);
    }
    return {
      status: 200,
      body: track,
    };
  },
  patch: async ({ body, params, query, user }) => {
    const tempNewAlbumId = await generateAlbumId();
    const tempNewArtistId = await generateArtistId();

    const data = await client.$transaction(async (txClient) => {
      const track = await txClient.track.findFirst({
        where: {
          id: params.trackId,
          userId: user.id,
        },
        include: {
          album: true,
        },
      });
      if (!track) {
        throw new HTTPError(404, `track ${params.trackId} not found`);
      }

      // create artist
      let artistId: string | undefined;
      if (body.artistId) {
        const artist = await txClient.artist.findFirst({
          where: {
            id: body.artistId,
            userId: user.id,
          },
        });
        if (!artist) {
          throw new HTTPError(400, `Artist ${body.artistId} not found`);
        }
        artistId = artist.id;
      } else if (body.artistName) {
        const artist = query?.forceNewArtist
          ? await txClient.artist.create({
              data: {
                id: tempNewArtistId,
                name: body.artistName,
                userId: user.id,
              },
            })
          : await dbArtistGetOrCreateByNameTx(
              txClient,
              user.id,
              body.artistName,
              tempNewArtistId
            );
        artistId = artist.id;
      }

      // create album
      let albumId: string | undefined;
      if (body.albumId) {
        const album = await txClient.album.findFirst({
          where: {
            id: body.albumId,
            userId: user.id,
          },
        });
        if (!album) {
          throw new HTTPError(400, `Album ${body.albumId} not found`);
        }
        albumId = album.id;
      } else if (body.albumTitle) {
        const newArtistId =
          artistId ||
          (query?.preferAlbumArtist ? track.album.artistId : track.artistId);
        const album = query?.forceNewAlbum
          ? await txClient.album.create({
              data: {
                id: tempNewAlbumId,
                title: body.albumTitle,
                artistId: newArtistId,
                userId: user.id,
              },
            })
          : await dbAlbumGetOrCreateByNameTx(
              txClient,
              user.id,
              newArtistId,
              body.albumTitle,
              tempNewAlbumId
            );
        albumId = album.id;
      }

      // update track
      return txClient.track.update({
        data: {
          title: body.title,
          albumId,
          artistId,
        },
        where: {
          id: track.id,
        },
      });
    });

    return { status: 204, body: data };
  },
  delete: async ({ params, user }) => {
    // TODO
    return { status: 204 };
  },
}));
