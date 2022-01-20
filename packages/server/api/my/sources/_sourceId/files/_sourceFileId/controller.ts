import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { onSourceFileFailed, onSourceFileUploaded } from '$/services/uploadEnd';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ params, user, body }) => {
    switch (body.state) {
      case 'upload_aborted':
        await onSourceFileFailed(
          user.id,
          params.sourceId,
          params.sourceFileId,
          true
        );
        break;

      case 'upload_failed':
        await onSourceFileFailed(
          user.id,
          params.sourceId,
          params.sourceFileId,
          false
        );
        break;

      case 'uploaded':
        if (!body.parts) {
          throw new HTTPError(400, 'parts is required');
        }
        await onSourceFileUploaded(
          user.id,
          params.sourceId,
          params.sourceFileId,
          body.parts
        );
        break;
    }
    return {
      status: 202,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
    };
  },
}));
