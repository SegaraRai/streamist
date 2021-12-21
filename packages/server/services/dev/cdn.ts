import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyCors from 'fastify-cors';
import type { ObjectStorage } from '$shared-server/objectStorage';
import {
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
} from '$shared-server/objectStorages';
import { toRegion } from '$shared/regions';
import { extractPayloadFromCDNToken } from '../tokens';
import { createUserDownloadS3Cached } from '../userOS';

const PRESIGNED_URL_EXPIRES_IN = 15 * 60;

export const devCDN: FastifyPluginCallback<{}> = (
  fastify: FastifyInstance,
  options: { prefix?: string },
  done: (err?: Error) => void
): void => {
  if (process.env.NODE_ENV !== 'development') {
    done();
    return;
  }

  fastify.register(fastifyCookie);
  fastify.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  fastify.route({
    method: 'POST',
    url: '/api/cookies/token',
    handler: async (request, reply) => {
      const authorization = String(request.headers.authorization || '');
      if (!authorization?.startsWith('Bearer ')) {
        return reply.code(401).send('Unauthorized');
      }

      const token = authorization.slice(7);
      const payload = await extractPayloadFromCDNToken(token);
      if (!payload) {
        return reply.code(401).send();
      }

      reply.setCookie('token', token, {
        expires: new Date(payload.exp * 1000),
        httpOnly: true,
        path: options.prefix || '/',
        sameSite: 'none',
        secure: true,
      });

      return reply.code(204).send();
    },
  });

  fastify.route({
    method: 'GET',
    url: '/files/:region/:type/:userId/:filename',
    handler: async (request, reply) => {
      const token = request.cookies.token;
      if (!token) {
        return reply.code(401).send();
      }

      const payload = await extractPayloadFromCDNToken(token);
      if (!payload) {
        return reply.code(401).send();
      }

      const params = request.params as Record<string, string>;
      const { type, userId, filename } = params;
      const region = toRegion(params.region);

      if (userId !== payload.id) {
        return reply.code(401).send();
      }

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

  done();
};
