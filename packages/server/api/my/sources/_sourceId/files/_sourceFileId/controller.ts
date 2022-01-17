import { onSourceFileFailed, onSourceFileUploaded } from '$/services/uploadEnd';
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
        await onSourceFileUploaded(
          user.id,
          params.sourceId,
          params.sourceFileId,
          body.parts
        );
        break;
    }
    return { status: 202 };
  },
}));
