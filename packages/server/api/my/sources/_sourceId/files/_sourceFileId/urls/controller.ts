import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { getUploadURLForSourceFile } from '$/services/uploadBegin';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const body = await getUploadURLForSourceFile(
      user.id,
      params.sourceId,
      params.sourceFileId
    );
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body,
    };
  },
}));
