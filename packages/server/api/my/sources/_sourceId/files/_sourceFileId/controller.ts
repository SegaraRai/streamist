import { onSourceFileUploaded } from '$/services/uploadEnd.js';
import { HTTPError } from '$/utils/httpError.js';
import { defineController } from './$relay.js';

export default defineController(() => ({
  patch: async ({ params, user, body }) => {
    if (body.state !== 'uploaded') {
      throw new HTTPError(400, 'state must be uploaded');
    }

    await onSourceFileUploaded(
      user.id,
      params.sourceId,
      params.sourceFileId,
      body.parts
    );

    return { status: 202 };
  },
}));
