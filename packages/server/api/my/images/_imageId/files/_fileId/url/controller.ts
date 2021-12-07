import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages';
import { Region } from '$shared/regions';
import { client } from '$/db/lib/client';
import { createUserDownloadS3Cached } from '$/services/userOS';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const imageFile = await client.imageFile.findFirst({
      where: {
        id: params.fileId,
        imageId: params.imageId,
        userId: user.id,
      },
    });
    if (!imageFile) {
      throw new HTTPError(404, `image file ${params.fileId} not found`);
    }

    const os = getTranscodedImageFileOS(imageFile.region as Region);
    const key = getTranscodedImageFileKey(
      user.id,
      params.fileId,
      imageFile.extension
    );
    const s3 = createUserDownloadS3Cached(os);

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: os.bucket,
        Key: key,
      }),
      {
        expiresIn: 15 * 60,
      }
    );

    return {
      status: 200,
      body: url,
    };
  },
}));
