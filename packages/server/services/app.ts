import Fastify, { FastifyServerFactory } from 'fastify';
import cors from 'fastify-cors';
import helmet from 'fastify-helmet';
import fastifyJwt from 'fastify-jwt';
import server from '$/$server';
import { devCDN } from '$/services/dev';
import { API_BASE_PATH, SECRET_API_JWT_SECRET } from '$/services/env';
import { registerTranscoderCallback } from '$/services/transcoderCallback';

export const init = (serverFactory?: FastifyServerFactory) => {
  const app = Fastify({ serverFactory });

  app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        // as this is an API server, we don't have to fetch any resources
        defaultSrc: ["'none'"],
      },
    },
  });

  registerTranscoderCallback(app);

  if (process.env.NODE_ENV === 'development') {
    app.register(devCDN, {
      prefix: '/dev/cdn',
    });
  }

  // NOTE: not setting custom error handler as fastify's default one works fine
  // TODO(prod): should be set in production to collect errors and send them to sentry or something
  app.register(
    (fastify, _options, done) => {
      if (process.env.NODE_ENV === 'development') {
        fastify.register(cors, {
          origin: true,
        });
      } else {
        // TODO(prod): set allowed origins for production and staging environments
        fastify.register(cors);
      }
      fastify.register(fastifyJwt, { secret: SECRET_API_JWT_SECRET });
      server(fastify);
      done();
    },
    {
      prefix: API_BASE_PATH,
    }
  );
  return app;
};
