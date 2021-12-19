import { generatePlaylistId } from '$shared-server/generateId';
import { client } from '$/db/lib/client';
import { updateUserResourceTimestamp } from '$/db/resource';
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
    const playlist = await client.playlist.create({
      data: {
        id: await generatePlaylistId(),
        title: body.title,
        notes: body.notes,
        userId: user.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    await updateUserResourceTimestamp(user.id);

    return {
      status: 201,
      headers: {
        Location: `/api/my/playlists/${playlist.id}`,
      },
      body: playlist,
    };
  },
}));
