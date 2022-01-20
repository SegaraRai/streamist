import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import {
  playlistImageDelete,
  playlistImageMoveBefore,
} from '$/services/playlists';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await playlistImageMoveBefore(
      user.id,
      params.playlistId,
      params.imageId,
      body.nextImageId || undefined
    );
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
  delete: async ({ params, user }) => {
    await playlistImageDelete(user.id, params.playlistId, params.imageId);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
}));
