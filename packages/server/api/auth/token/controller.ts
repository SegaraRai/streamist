import {
  extractUserIdFromRefreshToken,
  issueAPIToken,
  issueCDNToken,
} from '$/services/tokens';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ body }) => {
    const userId = await extractUserIdFromRefreshToken(body.refreshToken);
    if (!userId) {
      throw new HTTPError(401, 'Invalid refresh token');
    }

    // TODO: check if refresh token is not revoked

    const timestamp = Date.now();
    const apiToken = await issueAPIToken(userId, timestamp);
    const cdnToken = await issueCDNToken(userId, timestamp);

    return {
      status: 201,
      body: {
        apiToken,
        cdnToken,
      },
    };
  },
}));
