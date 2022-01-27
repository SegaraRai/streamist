import { pino } from 'pino';

export const logger = pino(
  process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l o',
            ignore: 'hostname',
          },
        },
      }
    : {}
);
