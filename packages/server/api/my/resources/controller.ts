import { dbArrayDeserializeItemIds } from '$shared/dbArray';
import type { Album, Playlist } from '$prisma/client';
import { client } from '$/db/lib/client';
import type {
  ResourceAlbum,
  ResourceDeletion,
  ResourcePlaylist,
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

function convertPlaylist(playlist: Playlist): ResourcePlaylist {
  return {
    ...playlist,
    trackIds: dbArrayDeserializeItemIds(playlist.trackOrder),
  };
}

function convertPlaylists(playlists: readonly Playlist[]): ResourcePlaylist[] {
  return playlists.map(convertPlaylist);
}

export default defineController(() => ({
  get: async ({ query, user }) => {
    const timestamp = Date.now();

    const since = new Date(query?.since || 0);

    const data = await client.$transaction(async (txClient) => {
      const dbUser = await txClient.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!dbUser) {
        throw new HTTPError(404, `User ${user.id} not found`);
      }

      const where = {
        userId: user.id,
        updatedAt: {
          gte: since,
        },
      } as const;

      return {
        timestamp,
        user: dbUser,
        albumCoArtists: await txClient.albumCoArtist.findMany({
          where,
        }),
        albums: convertAlbums(
          await txClient.album.findMany({
            where,
          })
        ),
        artists: await txClient.artist.findMany({
          where,
        }),
        images: await txClient.image.findMany({
          where,
          include: {
            files: true,
          },
        }),
        playlists: convertPlaylists(
          await txClient.playlist.findMany({
            where,
          })
        ),
        sourceFiles: await txClient.sourceFile.findMany({
          where,
        }),
        sources: await txClient.source.findMany({
          where,
        }),
        tags: await txClient.tag.findMany({
          where,
          select: {
            id: true,
            name: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            albums: {
              select: {
                id: true,
              },
            },
            artists: {
              select: {
                id: true,
              },
            },
            playlists: {
              select: {
                id: true,
              },
            },
            tracks: {
              select: {
                id: true,
              },
            },
          },
        }),
        trackCoArtists: await txClient.trackCoArtist.findMany({
          where,
        }),
        tracks: await txClient.track.findMany({
          where,
          include: {
            files: true,
          },
        }),
        deletions: (await txClient.deletion.findMany({
          where: {
            userId: user.id,
            deletedAt: {
              gte: since,
            },
          },
        })) as ResourceDeletion[],
      };
    });

    return {
      status: 200,
      body: data,
    };
  },
}));
