import { generatePlaylistId } from '$shared-server/generateId';
import { client } from '$/db/lib/client';
import { dbPlaylistCreate } from '$/db/playlist';
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
    const playlist = await dbPlaylistCreate({
      id: await generatePlaylistId(),
      title: body.title,
      userId: user.id,
    });

    return {
      status: 201,
      body: playlist,
    };
  },
}));
