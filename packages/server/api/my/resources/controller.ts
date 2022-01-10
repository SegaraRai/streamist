import { fetchResources } from '$/services/resources';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ query, user }) => {
    const data = await fetchResources(user.id, Number(query?.since || 0));

    return {
      status: 200,
      body: data,
    };
  },
}));
