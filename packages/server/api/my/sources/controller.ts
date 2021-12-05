import { createAudioSource, createImageSource } from '$/services/uploadBegin';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  post: async ({ user, body }) => {
    switch (body.type) {
      case 'audio':
        return {
          status: 200,
          body: await createAudioSource(user.id, body),
        };

      case 'image':
        return {
          status: 200,
          body: await createImageSource(user.id, body),
        };
    }
    throw new HTTPError(400, 'Invalid type');
  },
}));
