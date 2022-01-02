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
import { defineController } from './$relay';

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

export default defineController(() => ({
  get: async ({ query, user }) => {
    const beginTimestamp = Date.now();

    const since = query?.since || 0;

    const data = await client.$transaction(
      async (txClient): Promise<ResourcesNotUpdated | ResourcesUpdated> => {
        const resourceUpdate = await txClient.resourceUpdate.findUnique({
          where: {
            userId: user.id,
          },
        });

        if (!resourceUpdate) {
          throw new HTTPError(404, `User ${user.id} not found`);
        }

        const { updatedAt } = resourceUpdate;

        // some clock skew may occur because of transaction
        const timestamp = Math.max(
          beginTimestamp - RESOURCE_TIMESTAMP_MARGIN,
          Math.min(updatedAt + 1, beginTimestamp)
        );

        if (updatedAt < since) {
          return {
            updated: false,
            timestamp,
            updatedAt,
          } as const;
        }

        const dbUser = await txClient.user.findUnique({
          where: {
            id: user.id,
          },
        });

        if (!dbUser) {
          throw new HTTPError(404, `User ${user.id} not found`);
        }

        const query = {
          where: {
            userId: user.id,
            updatedAt: {
              gte: since,
            },
          },
        } as const;

        const queryWithFiles = {
          ...query,
          include: {
            files: true,
          },
        } as const;

        return {
          updated: true,
          timestamp,
          updatedAt,
          user: dbUser,
          albumCoArtists: await txClient.albumCoArtist.findMany(query),
          albums: convertAlbums(await txClient.album.findMany(query)),
          artists: convertArtists(await txClient.artist.findMany(query)),
          images: await txClient.image.findMany(queryWithFiles),
          playlists: convertPlaylists(await txClient.playlist.findMany(query)),
          sourceFiles: await txClient.sourceFile.findMany(query),
          sources: await txClient.source.findMany(query),
          trackCoArtists: await txClient.trackCoArtist.findMany(query),
          tracks: await txClient.track.findMany(queryWithFiles),
          deletions: (await txClient.deletion.findMany({
            where: {
              userId: user.id,
              deletedAt: {
                gte: since,
              },
            },
          })) as ResourceDeletion[],
        };
      }
    );

    return {
      status: 200,
      body: data,
    };
  },
}));
