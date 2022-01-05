import { onSourceFileUploaded } from '$/services/uploadEnd';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

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
