import { defineController } from './$relay';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';

export default defineController(() => ({
  get: async ({ user }) => {
    const dbUser = await client.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!dbUser) {
      throw new HTTPError(404, `User ${user.id} not found`);
    }
    return { status: 200, body: dbUser };
  },
}));
