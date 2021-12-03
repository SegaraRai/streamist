import Fastify, { FastifyServerFactory } from 'fastify';
import helmet from 'fastify-helmet';
import cors from 'fastify-cors';
import fastifyJwt from 'fastify-jwt';
import { API_JWT_SECRET, API_BASE_PATH } from '$/services/env';
import server from '$/$server';

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
  app.register(fastifyJwt, { secret: API_JWT_SECRET });
  // NOTE: not setting custom error handler as fastify's default one works fine
  // TODO(prod): should be set in production to collect errors and send them to sentry or something
  server(app, { basePath: API_BASE_PATH });
  return app;
};
