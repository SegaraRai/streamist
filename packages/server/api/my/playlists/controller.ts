import { generatePlaylistId } from '$shared-server/generateId';
import { dbArraySerializeItemIds } from '$/../shared/dbArray';
import { client } from '$/db/lib/client';
import { dbResourceUpdateTimestamp } from '$/db/lib/resource';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => {
    const playlists = await client.playlist.findMany({
      where: {
        userId: user.id,
      },
    });
    return { status: 200, body: playlists };
  },
  post: async ({ body, user }) => {
    const trackIds = body.trackIds || [];
    if (Array.from(new Set(trackIds)).length !== trackIds.length) {
      throw new HTTPError(400, 'trackIds must be unique');
    }

    const playlist = await client.playlist.create({
      data: {
        id: await generatePlaylistId(),
        title: String(body.title),
        notes: String(body.notes),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        trackOrder: dbArraySerializeItemIds(trackIds),
        tracks: {
          connect: trackIds.map((trackId) => ({ id: String(trackId) })),
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    await dbResourceUpdateTimestamp(user.id);

    return {
      status: 201,
      headers: {
        Location: `/api/my/playlists/${playlist.id}`,
      },
      body: playlist,
    };
  },
}));
