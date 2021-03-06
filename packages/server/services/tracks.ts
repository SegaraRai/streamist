import { Prisma, Track, TrackCoArtist } from '@prisma/client';
import PQueue from 'p-queue';
import {
  generateAlbumId,
  generateArtistId,
  generateTrackCoArtistId,
} from '$shared-server/generateId';
import { parseDate } from '$shared/parseDate';
import { emptyToNull } from '$shared/transform';
import { dbAlbumGetOrCreateByNameTx } from '$/db/album';
import { dbArtistCreateCachedGetOrCreateByNameTx } from '$/db/artist';
import { dbArrayRemoveFromAllTx } from '$/db/lib/array';
import { client } from '$/db/lib/client';
import { dbDeletionAddTx, dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import { osDeleteTrackFiles } from '$/os/trackFile';
import { albumDeleteIfUnreferenced } from '$/services/albums';
import { artistDeleteIfUnreferenced } from '$/services/artists';
import { updateMaxTrackId } from '$/services/maxTrack';
import { sourceFileDeleteFromOSIfUnreferenced } from '$/services/sourceFiles';
import { HTTPError } from '$/utils/httpError';
import type { ITrackUpdateData } from '$/validators';

export interface TrackUpdateOptions {
  readonly forceNewAlbum?: boolean;
  readonly forceNewArtist?: boolean;
  readonly preferOldArtist?: boolean;
  readonly preferAlbumArtist?: boolean;
}

export async function trackUpdate(
  userId: string,
  trackId: string,
  data: ITrackUpdateData,
  {
    forceNewAlbum = false,
    forceNewArtist = false,
    preferOldArtist = false,
    preferAlbumArtist = false,
  }: TrackUpdateOptions
): Promise<Track> {
  const parsedDate =
    data.releaseDateText != null ? parseDate(data.releaseDateText) : undefined;

  const [oldTrack, newTrack] = await client.$transaction(async (txClient) => {
    const timestamp = dbGetTimestamp();

    const artistGetOrCreateTx = dbArtistCreateCachedGetOrCreateByNameTx(
      txClient,
      userId
    );

    const track = await txClient.track.findFirst({
      where: {
        id: trackId,
        userId,
      },
      select: {
        albumId: true,
        artistId: true,
        album: {
          select: {
            artistId: true,
          },
        },
      },
    });
    if (!track) {
      throw new HTTPError(404, `track ${trackId} not found`);
    }

    // create artist
    let artistId: string | undefined;
    if (data.artistId) {
      const artist = await txClient.artist.findFirst({
        where: {
          id: data.artistId,
          userId,
        },
        select: {
          id: true,
        },
      });
      if (!artist) {
        throw new HTTPError(400, `Artist ${data.artistId} not found`);
      }
      artistId = artist.id;
    } else if (data.artistName) {
      const artist = forceNewArtist
        ? await txClient.artist.create({
            data: {
              id: await generateArtistId(),
              name: data.artistName,
              userId,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          })
        : await artistGetOrCreateTx(data.artistName);
      artistId = artist.id;
    }

    // create album
    let albumId: string | undefined;
    if (data.albumId) {
      const album = await txClient.album.findFirst({
        where: {
          id: data.albumId,
          userId,
        },
        select: {
          id: true,
        },
      });
      if (!album) {
        throw new HTTPError(400, `Album ${data.albumId} not found`);
      }
      albumId = album.id;
    } else if (data.albumTitle) {
      const newAlbumArtistId =
        (!preferOldArtist && artistId) ||
        (preferAlbumArtist ? track.album.artistId : track.artistId);
      const album = forceNewAlbum
        ? await txClient.album.create({
            data: {
              id: await generateAlbumId(),
              title: data.albumTitle,
              artistId: newAlbumArtistId,
              userId,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          })
        : await dbAlbumGetOrCreateByNameTx(
            txClient,
            userId,
            newAlbumArtistId,
            data.albumTitle,
            await generateAlbumId()
          );
      albumId = album.id;
    }

    // update coArtists
    if (data.coArtists) {
      if (data.coArtists.remove?.length) {
        const coArtists = await txClient.trackCoArtist.findMany({
          where: {
            OR: data.coArtists.remove.map(({ artistId, role }) => ({
              artistId,
              role,
            })),
            AND: {
              trackId,
              userId,
            },
          },
        });
        const coArtistIds = coArtists.map((coArtist) => coArtist.id);
        const deleted = await txClient.trackCoArtist.deleteMany({
          where: {
            id: {
              in: coArtistIds,
            },
          },
        });
        if (deleted.count !== coArtistIds.length) {
          throw new HTTPError(409, 'coArtists was deleted during track update');
        }
        await dbDeletionAddTx(txClient, userId, 'trackCoArtist', coArtistIds);
      }
      if (data.coArtists.add?.length) {
        const queue = new PQueue({ concurrency: 1 });
        const resolvedCoArtists = await Promise.all(
          data.coArtists.add
            .filter(({ artistName, artistId }) => artistName || artistId)
            .map(({ artistName, artistId, role }) =>
              queue.add(async () =>
                artistId
                  ? { role, artistId }
                  : {
                      role,
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      artistId: (await artistGetOrCreateTx(artistName!)).id,
                    }
              )
            )
        );
        const newCoArtists: TrackCoArtist[] = await Promise.all(
          resolvedCoArtists.map(async ({ role, artistId }) => ({
            id: await generateTrackCoArtistId(),
            trackId,
            userId,
            artistId,
            role,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        );
        await txClient.trackCoArtist.createMany({
          data: newCoArtists,
        });
      }
    }

    // update track
    const newTrack = await txClient.track.update({
      where: {
        id: trackId,
      },
      data: {
        title: data.title,
        titleSort: emptyToNull(data.titleSort),
        discNumber: data.discNumber,
        trackNumber: data.trackNumber,
        comment: emptyToNull(data.comment),
        lyrics: emptyToNull(data.lyrics),
        releaseDate: parsedDate?.dateString$$q ?? null,
        releaseDatePrecision: parsedDate?.precision$$q ?? null,
        releaseDateText: parsedDate?.text$$q ?? null,
        genre: emptyToNull(data.genre),
        bpm: data.bpm,
        sensitive: data.sensitive,
        albumId,
        artistId,
        updatedAt: timestamp,
      },
    });

    return [track, newTrack];
  });

  let checkedArtistId: string | undefined;
  if (newTrack.albumId !== oldTrack.albumId) {
    const albumArtistId = await albumDeleteIfUnreferenced(
      userId,
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
      await artistDeleteIfUnreferenced(userId, albumArtistId, true);
      checkedArtistId = albumArtistId;
    }
  }

  if (
    newTrack.artistId !== oldTrack.artistId &&
    oldTrack.artistId !== checkedArtistId
  ) {
    await artistDeleteIfUnreferenced(userId, oldTrack.artistId, true);
  }

  for (const { artistId } of data.coArtists?.remove ?? []) {
    if (artistId === checkedArtistId || artistId === oldTrack.artistId) {
      continue;
    }
    await artistDeleteIfUnreferenced(userId, artistId, true);
  }

  await dbResourceUpdateTimestamp(userId);

  return newTrack;
}

/**
 * ?????????????????????????????????????????? \
 * ?????????????????????????????????????????????????????????????????????????????????????????????????????? \
 * ??????????????????????????????????????????????????????
 *
 * @description
 * - ???????????????????????????: TrackCoArtist (via CASCADE)
 * ! ?????????????????????????????????????????????????????????????????? \
 * ! ??????????????????????????????????????????????????????????????????
 */
export async function trackDelete(
  userId: string,
  trackId: string,
  deleteAlbumAndArtists = false
): Promise<void> {
  const [track, trackFiles] = await client.$transaction(async (txClient) => {
    const track = await txClient.track.findFirst({
      where: {
        id: trackId,
        userId,
      },
      select: {
        albumId: true,
        artistId: true,
        sourceFileId: true,
      },
    });
    if (!track) {
      throw new HTTPError(404, `Track ${trackId} not found`);
    }

    // remove track from playlists
    await dbArrayRemoveFromAllTx<typeof Prisma.PlaylistScalarFieldEnum>(
      txClient,
      userId,
      Prisma.ModelName.APlaylistTrack,
      Prisma.ModelName.Playlist,
      'trackOrder',
      trackId
    );

    // delete track files
    // * TrackFile id is referenced from: (none)
    const trackFiles = await txClient.trackFile.findMany({
      where: {
        trackId,
        userId,
      },
      select: {
        id: true,
        extension: true,
        region: true,
        trackId: true,
        userId: true,
      },
    });

    const deletedFiles = await txClient.trackFile.deleteMany({
      where: {
        id: {
          in: trackFiles.map((trackFile) => trackFile.id),
        },
        trackId,
        userId,
      },
    });
    if (deletedFiles.count !== trackFiles.length) {
      throw new HTTPError(
        409,
        `TrackFile of Track ${trackId} was modified during deletion`
      );
    }

    // delete track
    // * Track id is referenced from: TrackCoArtist, Playlist (implicit m:n)
    // TrackCoArtist will be cascade deleted (Deletion of TrackCoArtist is not recorded, therefore the client must synchronize TrackCoArtist based on the Deletion of Track)
    const deleted = await txClient.track.deleteMany({
      where: {
        id: trackId,
        albumId: track.albumId,
        artistId: track.artistId,
        sourceFileId: track.sourceFileId,
        userId,
      },
    });
    if (deleted.count === 0) {
      throw new HTTPError(409, `Track ${trackId} was modified during deletion`);
    }

    await dbDeletionAddTx(txClient, userId, 'track', trackId);

    return [track, trackFiles];
  });

  if (deleteAlbumAndArtists) {
    const albumArtistId = await albumDeleteIfUnreferenced(
      userId,
      track.albumId,
      true
    );

    await artistDeleteIfUnreferenced(userId, track.artistId, true);

    if (albumArtistId && albumArtistId !== track.artistId) {
      await artistDeleteIfUnreferenced(userId, albumArtistId, true);
    }
  }

  await sourceFileDeleteFromOSIfUnreferenced(userId, track.sourceFileId, true);

  await updateMaxTrackId(userId, true);

  await dbResourceUpdateTimestamp(userId);

  await osDeleteTrackFiles(trackFiles);
}
