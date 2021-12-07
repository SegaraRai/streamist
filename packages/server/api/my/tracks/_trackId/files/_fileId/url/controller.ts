import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
} from '$shared-server/objectStorages';
import { Region } from '$shared/regions';
import { client } from '$/db/lib/client';
import { createUserDownloadS3Cached } from '$/services/userOS';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ params, user }) => {
    const trackFile = await client.trackFile.findFirst({
      where: {
        id: params.fileId,
        trackId: params.trackId,
        userId: user.id,
      },
    });
    if (!trackFile) {
      throw new HTTPError(404, 'File not found');
    }

    const os = getTranscodedAudioFileOS(trackFile.region as Region);
    const key = getTranscodedAudioFileKey(
      user.id,
      params.fileId,
      trackFile.extension
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
