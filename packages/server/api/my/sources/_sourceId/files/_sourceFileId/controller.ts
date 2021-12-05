import { onSourceFileUploaded } from '$/services/uploadEnd.js';
import { HTTPError } from '$/utils/httpError.js';
import { defineController } from './$relay.js';

export default defineController(() => ({
  patch: async ({ params, user, body }) => {
    if (!body.uploaded) {
      throw new HTTPError(400, 'uploaded must be true');
    }

    await onSourceFileUploaded(user.id, params.sourceId, params.sourceFileId);

    return { status: 204 };
  },
}));
