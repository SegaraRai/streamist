import { client } from '$/db/lib/client';
import {
  issueAPIToken,
  issueCDNToken,
  issueRefreshToken,
} from '$/services/tokens';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    const user = await client.user.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!user) {
      throw new HTTPError(404, `User ${body.id} not found`);
    }

    // TODO(auth): check if password is correct
    if (body.pass !== 'password') {
      throw new HTTPError(401, 'Invalid password');
    }

    const timestamp = Date.now();
    const refreshToken = await issueRefreshToken(user.id, timestamp);
    const apiToken = await issueAPIToken(user.id, timestamp);
    const cdnToken = await issueCDNToken(user.id, timestamp);

    return {
      status: 201,
      body: {
        refreshToken,
        apiToken,
        cdnToken,
      },
    };
  },
}));
