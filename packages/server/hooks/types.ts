import type {
  onRequestHookHandler,
  preHandlerHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
} from 'fastify';

export type OnRequestHookHandler =
  | onRequestHookHandler
  | onRequestHookHandler[];

export type PreParsingHookHandler =
  | preParsingHookHandler
  | preParsingHookHandler[];

export type PreValidationHookHandler =
  | preValidationHookHandler
  | preValidationHookHandler[];

export type PreHandlerHookHandler =
  | preHandlerHookHandler
  | preHandlerHookHandler[];

export type Hooks = {
  onRequest?: OnRequestHookHandler;
  preParsing?: PreParsingHookHandler;
  preValidation?: PreValidationHookHandler;
  preHandler?: PreHandlerHookHandler;
};
