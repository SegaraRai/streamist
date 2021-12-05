import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const sourceFiles = await client.sourceFile.findMany({
      where: {
        sourceId: params.sourceId,
        userId: user.id,
      },
    });

    if (!sourceFiles.length) {
      throw new HTTPError(
        404,
        `no source files found for source ${params.sourceId}`
      );
    }

    return {
      status: 200,
      body: sourceFiles,
    };
  },
}));
