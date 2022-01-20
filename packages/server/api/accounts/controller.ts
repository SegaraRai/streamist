import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { userCreate, userDoesExist } from '$/services/accountRegister';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ query }) => {
    const exists = await userDoesExist(query.username);
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: {
        exists,
      },
    };
  },
  post: async ({ body }) => {
    const user = await userCreate(body);
    return {
      status: 201,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
        Location: `/api/accounts/${user.id}`,
      },
    };
  },
}));
