import Fastify, { FastifyServerFactory } from 'fastify';
import cors from 'fastify-cors';
import helmet from 'fastify-helmet';
import fastifyJwt from 'fastify-jwt';
import server from '$/$server';
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
  // TODO(prod): set allowed origins for production and staging environments
  app.register(cors);
  app.register(fastifyJwt, { secret: SECRET_API_JWT_SECRET });
  registerTranscoderCallback(app);
  // NOTE: not setting custom error handler as fastify's default one works fine
  // TODO(prod): should be set in production to collect errors and send them to sentry or something
  server(app, { basePath: API_BASE_PATH });
  return app;
};
