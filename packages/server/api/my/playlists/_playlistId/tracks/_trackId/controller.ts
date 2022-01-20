import { CACHE_CONTROL_NO_STORE } from '$shared/config';
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
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
  delete: async ({ params, user }) => {
    await playlistTrackRemove(user.id, params.playlistId, [params.trackId]);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
}));
