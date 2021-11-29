import { init } from '$/db/lib/_init';
import { truncate } from '$/db/lib/_truncate';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ body }) => {
    switch (body.action) {
      case 'init':
        await init();
        break;

      case 'truncate':
        await truncate();
        break;
    }

    return {
      status: 204,
    };
  },
}));
