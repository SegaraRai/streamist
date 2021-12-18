import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance } from 'fastify';
import type { ObjectStorage } from '$shared-server/objectStorage';
import {
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages';
import { toRegion } from '$shared/regions';
import { createUserDownloadS3Cached } from '../userOS';

const PRESIGNED_URL_EXPIRES_IN = 15 * 60;

export function registerDevCDN(app: FastifyInstance): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  app.route({
    method: 'GET',
    url: '/dev/cdn/:region/:type/:userId/:filename',
    handler: async (request, reply) => {
      const params = request.params as Record<string, string>;
      const { type, userId, filename } = params;
      const region = toRegion(params.region);

      let os: ObjectStorage;
      let key: string;

      switch (type) {
        case 'audio':
          os = getTranscodedAudioFileOS(region);
          key = getTranscodedAudioFileKey(userId, filename, '');
          break;

        case 'image':
          os = getTranscodedImageFileOS(region);
          key = getTranscodedImageFileKey(userId, filename, '');
          break;

        default:
          throw new Error(`unknown type: ${type}`);
      }

      const s3 = createUserDownloadS3Cached(os);
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: os.bucket,
          Key: key,
        }),
        {
          expiresIn: PRESIGNED_URL_EXPIRES_IN,
        }
      );

      return reply
        .header('Cache-Control', `private, max-age=${PRESIGNED_URL_EXPIRES_IN}`)
        .redirect(302, url);
    },
  });
}
