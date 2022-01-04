import { client } from '$/db/lib/client';
import { playlistCreate } from '$/services/playlists';
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
    const playlist = await playlistCreate(user.id, body);
    return {
      status: 201,
      headers: {
        Location: `/api/my/playlists/${playlist.id}`,
      },
      body: playlist,
    };
  },
}));
