import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController((fastify) => ({
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

    return {
      status: 200,
      body: {
        token: fastify.jwt.sign({
          id: user.id,
        }),
      },
    };
  },
}));
