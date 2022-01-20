import { userUpdate } from '$/services/account';
import { defineController } from './$relay';

export default defineController(() => ({
  patch: async ({ body, user }) => {
    await userUpdate(user.id, body);
    return { status: 204 };
  },
}));
