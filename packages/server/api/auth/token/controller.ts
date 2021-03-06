import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { issueTokensFromRefreshToken } from '$/services/tokens';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    if (body.grant_type !== 'refresh_token') {
      throw new HTTPError(400, 'Invalid grant_type');
    }

    const data = await issueTokensFromRefreshToken(body.refresh_token);

    return {
      status: 201,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
      body: data,
    };
  },
}));
