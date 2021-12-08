import { createAudioSource, createImageSource } from '$/services/uploadBegin';
import type {
  CreateSourceRequestAudio,
  CreateSourceRequestImage,
  CreateSourceResponse,
} from '$/types';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

function createSource(
  userId: string,
  request: CreateSourceRequestAudio | CreateSourceRequestImage
): Promise<CreateSourceResponse> {
  switch (request.type) {
    case 'audio':
      return createAudioSource(userId, request);

    case 'image':
      return createImageSource(userId, request);
  }
  throw new HTTPError(400, 'invalid type');
}

export default defineController(() => ({
  post: async ({ user, body }) => {
    const response = await createSource(user.id, body);
    return {
      status: 201,
      headers: {
        Location: `/api/my/sources/${response.sourceId}`,
      },
      body: response,
    };
  },
}));
