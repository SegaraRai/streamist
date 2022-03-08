import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => ({
    status: 200,
    body: 'streamist',
    headers: {
      'Cache-Control': CACHE_CONTROL_NO_STORE,
    },
  }),
  post: () => ({
    status: 200,
    body: 'streamist',
    headers: {
      'Cache-Control': CACHE_CONTROL_NO_STORE,
    },
  }),
}));
