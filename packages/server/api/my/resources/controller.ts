import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

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
        albums: await txClient.album.findMany({
          where,
        }),
        artists: await txClient.artist.findMany({
          where,
        }),
        images: await txClient.image.findMany({
          where,
        }),
        playlists: await txClient.playlist.findMany({
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
        }),
      };
    });

    return {
      status: 200,
      body: data,
    };
  },
}));
