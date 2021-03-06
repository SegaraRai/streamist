import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { client } from '$/db/lib/client';
import {
  convertSource,
  convertSourceFile,
} from '$/services/resourceTransformer';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const source = await client.source.findFirst({
      where: {
        id: params.sourceId,
        userId: user.id,
      },
      include: {
        files: true,
      },
    });
    if (!source) {
      throw new HTTPError(404, `source ${params.sourceId} not found`);
    }
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: {
        ...convertSource(source),
        files: source.files.map(convertSourceFile),
      },
    };
  },
}));
