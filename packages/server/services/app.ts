import '$/services/initOS';
import '$/services/initCredentials';

import closeWithGrace from 'close-with-grace';
import Fastify, {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyServerFactory,
} from 'fastify';
import helmet from 'fastify-helmet';
import { fastifyJwt } from 'fastify-jwt';
import server from '$/$server';
import { TRANSCODER_CALLBACK_API_PATH } from '$/config';
import {
  API_BASE_PATH,
  SECRET_API_JWT_SECRET,
  SECRET_API_PROXY_AUTH_TOKEN,
} from '$/services/env';
import { fastPlainToInstance } from '$/services/fastClassTransformer';
import { transcoderCallbackPlugin } from '$/services/transcoderCallback';
import { HTTPError } from '$/utils/httpError';

const appPlugin: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options: unknown,
  done: (err?: Error) => void
): void => {
  const proxyAuthorization = `Bearer ${SECRET_API_PROXY_AUTH_TOKEN}`;
  fastify.addHook('onRequest', (request, _reply, done): void => {
    // console.log('onRequest', request.headers);
    if (
      request.headers['streamist-proxy-authorization'] !== proxyAuthorization
    ) {
      fastify.log.warn(
        'unauthenticated request from %s, %s',
        request.ip,
        request.headers['x-forwarded-for']
      );
      done(new HTTPError(401, 'Incorrect proxy token'));
      return;
    }
    done();
  });

  fastify.addHook('onSend', (_request, reply, _payload, done): void => {
    reply.header(
      'Streamist-Revision-Server',
      process.env.BUILD_REV || 'unknown'
    );
    done();
  });

  fastify.register(fastifyJwt, { secret: SECRET_API_JWT_SECRET });

  // NOTE: not setting custom error handler as fastify's default one works fine
  // TODO(prod): should be set in production to collect errors and send them to sentry or something

  server(fastify, {
    basePath: '',
    plainToInstance: fastPlainToInstance,
  });

  done();
};

export const init = (serverFactory?: FastifyServerFactory) => {
  const app = Fastify({
    serverFactory,
    logger: {
      prettyPrint:
        process.env.NODE_ENV === 'development'
          ? {
              translateTime: 'SYS:HH:MM:ss.l o',
              ignore: 'hostname',
            }
          : false,
    },
  });

  app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        // as this is an API server, we don't have to fetch any resources
        defaultSrc: ["'none'"],
      },
    },
  });

  app.register(transcoderCallbackPlugin, {
    prefix: TRANSCODER_CALLBACK_API_PATH,
  });

  app.register(appPlugin, {
    prefix: API_BASE_PATH,
  });

  const closeListeners = closeWithGrace(
    { delay: 10000 },
    ({ err }, callback): void => {
      if (err) {
        app.log.error(err);
      }
      app.log.info('shutting down worker');
      app.close().finally((): void => {
        callback();
      });
    }
  );

  app.addHook('onClose', (_instance, done): void => {
    closeListeners.uninstall();
    done();
  });

  return app;
};
