import { defineController } from './$relay';

export default defineController(() => ({
  get: () => {
    console.log('get');
    return { status: 200, body: 'Hello, world!' };
  },
}));
