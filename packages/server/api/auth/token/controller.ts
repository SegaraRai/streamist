import { issueTokens } from '$/services/tokens';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    const data = await issueTokens(body);
    return {
      status: 201,
      body: data,
    };
  },
}));
