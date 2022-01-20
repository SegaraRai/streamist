import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { userUpdate } from '$/services/account';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, user }) => {
    await userUpdate(user.id, body);
    return {
      status: 204,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
    };
  },
}));
