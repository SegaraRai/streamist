import type { Context } from 'worktop';
import type { Bindings } from 'worktop/cfw';
import type { Durable } from 'worktop/cfw.durable';
import type { SessionInfo } from '$shared/types';

export interface WSBindings extends Bindings {
  readonly DO: Durable.Namespace;
  readonly APP_ORIGIN: string;
  readonly WS_ORIGIN_FOR_SERVER: string;
  readonly SECRET_WS_JWT_SECRET: string;
  readonly SECRET_WS_AUTH_TOKEN: string;
}

export interface WSContext extends Context {
  bindings: WSBindings;
}

export interface DORequestData {
  deviceId: string;
  host: boolean;
  info: SessionInfo;
}
