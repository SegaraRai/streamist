import { generatePlaylistId } from '$shared-server/generateId';
import { client } from '$/db/lib/client';
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
        userId: user.id,
      },
    });

    return {
      status: 201,
      headers: {
        Location: `/api/my/playlists/${playlist.id}`,
      },
      body: playlist,
    };
  },
}));
