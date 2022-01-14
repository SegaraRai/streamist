import {
  onSourceFileAborted,
  onSourceFileUploaded,
} from '$/services/uploadEnd';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ params, user, body }) => {
    switch (body.state) {
      case 'aborted':
        await onSourceFileAborted(
          user.id,
          params.sourceId,
          params.sourceFileId
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
