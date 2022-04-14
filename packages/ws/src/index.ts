import { Router } from 'worktop';
import { start } from 'worktop/cfw';
import { reply } from 'worktop/response';
import { connect } from 'worktop/ws';
import {
  CACHE_CONTROL_NO_STORE,
  JWT_WS_TOKEN_AUD,
  WS_PROTOCOL,
  WS_QUERY_PARAM_DEVICE_CLIENT,
  WS_QUERY_PARAM_DEVICE_ID,
  WS_QUERY_PARAM_DEVICE_NAME,
  WS_QUERY_PARAM_DEVICE_PLATFORM,
  WS_QUERY_PARAM_DEVICE_TYPE,
  WS_QUERY_PARAM_HOST,
  WS_TOKEN_PROTOCOL_PREFIX,
} from '$shared/config';
import { encodeRFC8187ValueChars } from '$shared/encodeURI';
import type { ClientName, DeviceType } from '$shared/types';
import { verifyJWT } from './jwt';
import { convertToMutableResponse } from './response';
import type { DORequestData, WSContext } from './types';

function getAppOrigin(
  req: Request,
  context: Pick<WSContext, 'bindings' | 'url'>
): string {
  return BUILD_TIME_DEFINITION.NODE_ENV === 'development' &&
    context.bindings.DEV_WS_SKIP_ORIGIN_CHECK === '1'
    ? req.headers.get('Origin') || context.url.origin
    : context.bindings.APP_ORIGIN;
}

const API = new Router<WSContext>();

API.prepare = (_req, context) => {
  context.defer((res): void => {
    res.headers.set('Cache-Control', CACHE_CONTROL_NO_STORE);
    res.headers.set('Streamist-Revision-WS', BUILD_TIME_DEFINITION.BUILD_REV);
  });
};

API.add(
  'GET',
  '/ws/channels/:userId',
  async (req, context): Promise<Response> => {
    // we have two endpoints (client side and server side) for this worker, so we need to check the origin
    // request protocol is 'https://' (not 'wss://') here so we can compare origin safely
    if (context.url.origin !== /* #__PURE__ */ getAppOrigin(req, context)) {
      return reply(404, null);
    }

    // Origin header is always present in WebSocket requests
    if (
      req.headers.get('Origin') !== /* #__PURE__ */ getAppOrigin(req, context)
    ) {
      return reply(403, 'Unauthorized origin');
    }

    // check if the request is WebSocket upgrade request
    const abortResponse = connect(req);
    if (abortResponse) {
      return abortResponse;
    }

    // parse params
    const { userId } = context.params;
    const { searchParams } = context.url;

    const host = searchParams.get(WS_QUERY_PARAM_HOST) === '1';
    const deviceId = searchParams.get(WS_QUERY_PARAM_DEVICE_ID);
    const deviceType = searchParams.get(WS_QUERY_PARAM_DEVICE_TYPE);
    const platform = searchParams.get(WS_QUERY_PARAM_DEVICE_PLATFORM);
    const client = searchParams.get(WS_QUERY_PARAM_DEVICE_CLIENT);
    const name = searchParams.get(WS_QUERY_PARAM_DEVICE_NAME) || '';
    if (!deviceId || !deviceType || !platform || !client) {
      return reply(400, 'Query parameters not set');
    }

    // Sec-WebSocket-Protocol may appear as a single comma-separated header or as multiple headers,
    // but can be handled uniformly because Headers.get() returns a comma-separated list.
    const swp = req.headers.get('Sec-WebSocket-Protocol');
    if (!swp) {
      return reply(401, 'Sec-WebSocket-Protocol header not set');
    }

    const protocols = swp.split(',').map((p) => p.trim());

    // check if the swp contains WS_PROTOCOL
    if (!protocols.includes(WS_PROTOCOL)) {
      return reply(400, `Protocol must contain ${WS_PROTOCOL}`);
    }

    // parse token
    // check only the first token protocol
    // we should not check more than one token to prevent brute force attacks
    const tokenProtocol = protocols.find((p) =>
      p.startsWith(WS_TOKEN_PROTOCOL_PREFIX)
    );
    if (!tokenProtocol) {
      return reply(400, 'Protocol must contain token');
    }

    // verify token
    const jwt = await verifyJWT(
      tokenProtocol.slice(WS_TOKEN_PROTOCOL_PREFIX.length),
      context.bindings
    );
    if (!jwt || jwt.aud !== JWT_WS_TOKEN_AUD) {
      return reply(401, 'Invalid token');
    }

    if (jwt.sub !== userId) {
      return reply(401, 'Token subject mismatch');
    }

    // send request to DO
    const requestData: DORequestData = {
      host,
      deviceId,
      info: {
        type: deviceType as DeviceType,
        platform,
        client: client as ClientName,
        name,
      },
    };

    const mutableReq = new Request(req);
    mutableReq.headers.delete('Cookie');
    mutableReq.headers.delete('Sec-WebSocket-Protocol');
    mutableReq.headers.set(
      'Streamist-DO-Request-Data',
      encodeRFC8187ValueChars(JSON.stringify(requestData))
    );

    const res = convertToMutableResponse(
      await context.bindings.DO.get(
        context.bindings.DO.idFromName(userId)
      ).fetch(`https://do/user`, mutableReq)
    );

    // https://github.com/cloudflare/miniflare/issues/179
    if (
      BUILD_TIME_DEFINITION.NODE_ENV !== 'development' ||
      !(globalThis as any).MINIFLARE
    ) {
      res.headers.set('Sec-WebSocket-Protocol', WS_PROTOCOL);
    }

    return res;
  }
);

export default start(API.run);

export * from './do';
