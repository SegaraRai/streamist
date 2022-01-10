import { dbArrayDeserializeItemIds } from '$shared/dbArray';
import type { Album, Artist, Playlist } from '$prisma/client';
import { client } from '$/db/lib/client';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceDeletion,
  ResourcePlaylist,
  ResourcesNotUpdated,
  ResourcesUpdated,
} from '$/types';
import { HTTPError } from '$/utils/httpError';

function convertAlbum(album: Album): ResourceAlbum {
  return {
    ...album,
    imageIds: dbArrayDeserializeItemIds(album.imageOrder),
  };
}

function convertAlbums(albums: readonly Album[]): ResourceAlbum[] {
  return albums.map(convertAlbum);
}

function convertArtist(artist: Artist): ResourceArtist {
  return {
    ...artist,
    imageIds: dbArrayDeserializeItemIds(artist.imageOrder),
  };
}

function convertArtists(artists: readonly Artist[]): ResourceArtist[] {
  return artists.map(convertArtist);
}

function convertPlaylist(playlist: Playlist): ResourcePlaylist {
  return {
    ...playlist,
    imageIds: dbArrayDeserializeItemIds(playlist.imageOrder),
    trackIds: dbArrayDeserializeItemIds(playlist.trackOrder),
  };
}

function convertPlaylists(playlists: readonly Playlist[]): ResourcePlaylist[] {
  return playlists.map(convertPlaylist);
}

// 10 sec.
const RESOURCE_TIMESTAMP_MARGIN = 10_000;

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
      });

      if (!resourceUpdate) {
        throw new HTTPError(404, `User ${userId} not found`);
      }

      const { updatedAt } = resourceUpdate;

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
                  gte: nSince,
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
        user: dbUser,
        albumCoArtists: await txClient.albumCoArtist.findMany(q),
        albums: convertAlbums(await txClient.album.findMany(q)),
        artists: convertArtists(await txClient.artist.findMany(q)),
        images: await txClient.image.findMany(qFiles),
        playlists: convertPlaylists(await txClient.playlist.findMany(q)),
        sourceFiles: await txClient.sourceFile.findMany(q),
        sources: await txClient.source.findMany(q),
        trackCoArtists: await txClient.trackCoArtist.findMany(q),
        tracks: await txClient.track.findMany(qFiles),
        deletions: (await txClient.deletion.findMany(
          qDel
        )) as ResourceDeletion[],
      };
    }
  );
}
