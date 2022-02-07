import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { issueTokensFromUsernamePassword } from '$/services/tokens';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    if (body.grant_type !== 'password') {
      throw new HTTPError(400, 'Invalid grant_type');
    }

    const data = await issueTokensFromUsernamePassword(
      body.username,
      body.password
    );

    return {
      status: 201,
      headers: { 'Cache-Control': CACHE_CONTROL_NO_STORE },
      body: data,
    };
  },
}));
