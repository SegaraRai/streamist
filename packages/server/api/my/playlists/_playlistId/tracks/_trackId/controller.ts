import {
  playlistTrackMoveBefore,
  playlistTrackRemove,
} from '$/services/playlists';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await playlistTrackMoveBefore(
      user.id,
      params.playlistId,
      params.trackId,
      body.nextTrackId
    );
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await playlistTrackRemove(user.id, params.playlistId, [params.trackId]);
    return { status: 204 };
  },
}));
