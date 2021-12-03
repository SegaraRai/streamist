import type {
  onRequestHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler,
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
