import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { createSource } from '$/services/uploadBegin';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ user, body }) => {
    const response = await createSource(user.id, body);
    return {
      status: 201,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
        Location: `/api/my/sources/${response.sourceId}`,
      },
      body: response,
    };
  },
}));
