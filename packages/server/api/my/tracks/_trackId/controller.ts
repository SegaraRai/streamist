import { generateAlbumId, generateArtistId } from '$shared-server/generateId';
import {
  ImageSortableAlbum,
  dbAlbumGetOrCreateByNameTx,
  dbAlbumSortImages,
} from '$/db/album';
import { dbArtistGetOrCreateByNameTx } from '$/db/artist';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { albumDeleteIfUnreferenced } from '$/services/albums';
import { artistDeleteIfUnreferenced } from '$/services/artists';
import { trackDelete } from '$/services/tracks';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, query, user }) => {
    const track = await client.track.findFirst({
      where: {
        id: params.trackId,
        userId: user.id,
      },
      include: {
        artist: !!query?.includeTrackArtist,
        album: !!query?.includeAlbum && {
          include: {
            artist: !!query.includeAlbumArtist,
            images: !!query.includeAlbumImages && {
              include: {
                files: true,
              },
            },
          },
        },
      },
    });
    if (!track) {
      throw new HTTPError(404, `track ${params.trackId} not found`);
    }
    if (query?.includeAlbum && query.includeAlbumImages) {
      const { album } = track;
      dbAlbumSortImages(album as unknown as ImageSortableAlbum);
    }
    return {
      status: 200,
      body: track,
    };
  },
  patch: async ({ body, params, query, user }) => {
    const [oldTrack, newTrack] = await client.$transaction(async (txClient) => {
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
                id: await generateArtistId(),
                name: body.artistName,
                userId: user.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            })
          : await dbArtistGetOrCreateByNameTx(
              txClient,
              user.id,
              body.artistName
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
                id: await generateAlbumId(),
                title: body.albumTitle,
                artistId: newArtistId,
                userId: user.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            })
          : await dbAlbumGetOrCreateByNameTx(
              txClient,
              user.id,
              newArtistId,
              body.albumTitle,
              await generateAlbumId()
            );
        albumId = album.id;
      }

      // update track
      const newTrack = await txClient.track.update({
        data: {
          title: body.title,
          albumId,
          artistId,
        },
        where: {
          id: track.id,
        },
      });

      return [track, newTrack];
    });

    let checkedArtistId: string | undefined;
    if (newTrack.albumId !== oldTrack.albumId) {
      const albumArtistId = await albumDeleteIfUnreferenced(
        user.id,
        oldTrack.albumId,
        true
      );

      // check if albumArtistId is in use
      if (
        // album was deleted and,
        albumArtistId &&
        // albumArtistId is not referenced (by newTrack)
        albumArtistId !== newTrack.artistId
      ) {
        await artistDeleteIfUnreferenced(user.id, albumArtistId, true);
        checkedArtistId = albumArtistId;
      }
    }

    if (
      newTrack.artistId !== oldTrack.artistId &&
      oldTrack.artistId !== checkedArtistId
    ) {
      await artistDeleteIfUnreferenced(user.id, oldTrack.artistId, true);
    }

    await dbResourceUpdateTimestamp(user.id);

    return { status: 204, body: newTrack };
  },
  delete: async ({ params, user }) => {
    await trackDelete(user.id, params.trackId, true);
    return {
      status: 204,
    };
  },
}));
