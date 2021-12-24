import { isPlainObject } from '$shared/isPlainObject';
import { client } from '$/db/lib/client';
import {
  extractUserIdFromRefreshToken,
  issueAPIToken,
  issueCDNToken,
  issueRefreshToken,
} from '$/services/tokens';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    if (!isPlainObject(body)) {
      throw new HTTPError(400, 'Malformed request body');
    }

    let userId: string;

    switch (body.grant_type) {
      case 'password': {
        const user = await client.user.findUnique({
          where: {
            id: String(body.username),
          },
        });

        if (!user) {
          throw new HTTPError(404, `User ${body.username} not found`);
        }

        // TODO(auth): check if password is correct
        if (String(body.password) !== 'password') {
          throw new HTTPError(401, 'Invalid password');
        }

        userId = user.id;

        break;
      }

      case 'refresh_token': {
        const extractedUserId = await extractUserIdFromRefreshToken(
          String(body.refresh_token)
        );
        if (!extractedUserId) {
          throw new HTTPError(401, 'Invalid refresh token');
        }
        // TODO: check if refresh token is not revoked
        userId = extractedUserId;
        break;
      }

      default:
        throw new HTTPError(400, 'Invalid grant type');
    }

    const timestamp = Date.now();
    const apiToken = await issueAPIToken(userId, timestamp);
    const cdnToken = await issueCDNToken(userId, timestamp);
    const refreshToken =
      body.grant_type === 'password'
        ? await issueRefreshToken(userId, timestamp)
        : undefined;

    return {
      status: 201,
      body: {
        access_token: apiToken,
        cdn_access_token: cdnToken,
        refresh_token: refreshToken,
      },
    };
  },
}));
