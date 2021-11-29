import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { dbPlaylistCreate } from '$/db/playlist';
import { generatePlaylistId } from '$/utils/id';

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
      name: body.name,
      userId: user.id,
    });

    return {
      status: 201,
      body: playlist,
    };
  },
}));
