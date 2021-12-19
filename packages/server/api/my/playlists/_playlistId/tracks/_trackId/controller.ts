import {
  dbPlaylistMoveTrackBefore,
  dbPlaylistRemoveTrack,
} from '$/db/playlist';
import { updateUserResourceTimestamp } from '$/db/resource';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, params, user }) => {
    await dbPlaylistMoveTrackBefore(
      user.id,
      params.playlistId,
      params.trackId,
      body.previousTrackId || undefined
    ).catch((error) => Promise.reject(new HTTPError(400, String(error))));
    await updateUserResourceTimestamp(user.id);
    return { status: 204 };
  },
  delete: async ({ params, user }) => {
    await dbPlaylistRemoveTrack(
      user.id,
      params.playlistId,
      params.trackId
    ).catch((error) => Promise.reject(new HTTPError(404, String(error))));
    await updateUserResourceTimestamp(user.id);
    return { status: 204 };
  },
}));
