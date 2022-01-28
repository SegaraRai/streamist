import { RESOURCE_TIMESTAMP_MARGIN } from '$/config';
import { client } from '$/db/lib/client';
import { dbGetTimestamp } from '$/db/lib/timestamp';
import type { ResourcesNotUpdated, ResourcesUpdated } from '$/types';
import { HTTPError } from '$/utils/httpError';
import {
  convertAlbum,
  convertAlbumCoArtist,
  convertArtist,
  convertDeletion,
  convertImage,
  convertPlaylist,
  convertSource,
  convertSourceFile,
  convertTrack,
  convertTrackCoArtist,
  convertUser,
} from './resourceTransformer';

export function fetchResources(
  userId: string,
  since?: number | null
): Promise<ResourcesNotUpdated | ResourcesUpdated> {
  const nSince = Number(since || 0);
  if (!isFinite(nSince)) {
    throw new HTTPError(400, 'Invalid since parameter');
  }

  const initTimestamp = Date.now();

  return client.$transaction(
    async (txClient): Promise<ResourcesNotUpdated | ResourcesUpdated> => {
      const resourceUpdate = await txClient.resourceUpdate.findUnique({
        where: {
          userId,
        },
        select: {
          updatedAt: true,
        },
      });

      if (!resourceUpdate) {
        throw new HTTPError(404, `User ${userId} not found`);
      }

      const updatedAt = Number(resourceUpdate.updatedAt);

      // some clock skew may occur because of transaction
      const timestamp = Math.max(
        initTimestamp - RESOURCE_TIMESTAMP_MARGIN,
        Math.min(updatedAt + 1, initTimestamp)
      );

      if (updatedAt < nSince) {
        return {
          updated: false,
          timestamp,
          updatedAt,
        } as const;
      }

      const dbUser = await txClient.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!dbUser) {
        throw new HTTPError(404, `User ${userId} not found`);
      }

      const q = {
        where: {
          userId,
          updatedAt:
            nSince > 0
              ? {
                  gte: dbGetTimestamp(nSince),
                }
              : undefined,
        },
      } as const;

      const qFiles = {
        ...q,
        include: {
          files: true,
        },
      } as const;

      const qDel = {
        where: {
          userId,
          deletedAt: q.where.updatedAt,
        },
      } as const;

      return {
        updated: true,
        timestamp,
        updatedAt,
        user: convertUser(dbUser),
        albumCoArtists: (await txClient.albumCoArtist.findMany(q)).map(
          convertAlbumCoArtist
        ),
        albums: (await txClient.album.findMany(q)).map(convertAlbum),
        artists: (await txClient.artist.findMany(q)).map(convertArtist),
        images: (await txClient.image.findMany(qFiles)).map(convertImage),
        playlists: (await txClient.playlist.findMany(q)).map(convertPlaylist),
        sourceFiles: (await txClient.sourceFile.findMany(q)).map(
          convertSourceFile
        ),
        sources: (await txClient.source.findMany(q)).map(convertSource),
        trackCoArtists: (await txClient.trackCoArtist.findMany(q)).map(
          convertTrackCoArtist
        ),
        tracks: (await txClient.track.findMany(qFiles)).map(convertTrack),
        deletions: (await txClient.deletion.findMany(qDel)).map(
          convertDeletion
        ),
      };
    }
  );
}
