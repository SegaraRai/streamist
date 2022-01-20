import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { issueTokens } from '$/services/tokens';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    const data = await issueTokens(body);
    return {
      status: 201,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
      body: data,
    };
  },
}));
