import '$/services/initOS';
import '$/services/initCredentials';

import closeWithGrace from 'close-with-grace';
import Fastify, { FastifyServerFactory } from 'fastify';
import cors from 'fastify-cors';
import helmet from 'fastify-helmet';
import fastifyJwt from 'fastify-jwt';
import server from '$/$server';
import { devCDN } from '$/services/dev';
import { API_BASE_PATH, SECRET_API_JWT_SECRET } from '$/services/env';
import { fastPlainToInstance } from '$/services/fastClassTransformer';
import { transcoderCallback } from '$/services/transcoderCallback';

export const init = (serverFactory?: FastifyServerFactory) => {
  const app = Fastify({
    serverFactory,
    logger: {
      prettyPrint:
        process.env.NODE_ENV === 'development'
          ? {
              translateTime: 'HH:MM:ss Z',
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

  app.register(transcoderCallback);

  if (process.env.NODE_ENV === 'development') {
    app.register(devCDN, {
      prefix: '/dev/cdn',
    });
  }

  // NOTE: not setting custom error handler as fastify's default one works fine
  // TODO(prod): should be set in production to collect errors and send them to sentry or something
  app.register(
    (fastify, _options, done): void => {
      if (process.env.NODE_ENV === 'development') {
        fastify.register(cors, {
          origin: true,
        });
      } else {
        // TODO(prod): set allowed origins for production and staging environments
        fastify.register(cors);
      }
      fastify.register(fastifyJwt, { secret: SECRET_API_JWT_SECRET });
      server(fastify, {
        plainToInstance: fastPlainToInstance,
      });
      done();
    },
    {
      prefix: API_BASE_PATH,
    }
  );

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
