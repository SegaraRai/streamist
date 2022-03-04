import { Router } from 'worktop';
import { start } from 'worktop/cfw';
import { reply } from 'worktop/response';
import { connect } from 'worktop/ws';
import { CACHE_CONTROL_NO_STORE, JWT_WS_TOKEN_AUD } from '$shared/config';
import type { ClientName, DeviceType } from '$shared/types';
import { encodeUTF8Base64URL } from '$shared/unicodeBase64';
import { verifyJWT } from './jwt';
import { convertToMutableResponse } from './response';
import type { DORequestData, WSContext } from './types';

const NO_CACHE_HEADERS = {
  'Cache-Control': CACHE_CONTROL_NO_STORE,
};

const API = new Router<WSContext>();

API.prepare = (_req, context) => {
  context.defer((res): void => {
    res.headers.set('Streamist-Revision-WS', BUILD_TIME_DEFINITION.BUILD_REV);
  });
};

API.add(
  'GET',
  '/ws/channels/:userId',
  async (req, context): Promise<Response> => {
    if (context.url.origin !== context.bindings.APP_ORIGIN) {
      return reply(404, null, NO_CACHE_HEADERS);
    }

    if (req.headers.get('Origin') !== context.bindings.APP_ORIGIN) {
      return reply(403, null, NO_CACHE_HEADERS);
    }

    const abortResponse = connect(req);
    if (abortResponse) {
      return abortResponse;
    }

    const { userId } = context.params;

    const host = context.url.searchParams.get('host') === '1';
    const deviceId = context.url.searchParams.get('d_id');
    const deviceType = context.url.searchParams.get('d_type');
    const platform = context.url.searchParams.get('d_platform');
    const client = context.url.searchParams.get('d_client');
    const name = context.url.searchParams.get('d_name') || '';
    if (!deviceId || !deviceType || !platform || !client) {
      return reply(400, 'query parameters not set', NO_CACHE_HEADERS);
    }

    const swp = req.headers.get('Sec-WebSocket-Protocol');
    if (!swp) {
      return reply(
        401,
        'Sec-WebSocket-Protocol header not set',
        NO_CACHE_HEADERS
      );
    }

    if (!swp.startsWith('token~')) {
      return reply(401, 'malformed Sec-WebSocket-Protocol', NO_CACHE_HEADERS);
    }

    const jwt = await verifyJWT(swp.slice(6), context.bindings);
    if (!jwt || jwt.aud !== JWT_WS_TOKEN_AUD) {
      return reply(401, 'invalid Sec-WebSocket-Protocol', NO_CACHE_HEADERS);
    }

    if (jwt.sub !== userId) {
      return reply(401, 'token subject mismatch', NO_CACHE_HEADERS);
    }

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
    mutableReq.headers.delete('Sec-WebSocket-Protocol');
    mutableReq.headers.set(
      'Streamist-DO-Request-Data',
      encodeUTF8Base64URL(JSON.stringify(requestData))
    );

    const res = convertToMutableResponse(
      await context.bindings.DO.get(
        context.bindings.DO.idFromName(userId)
      ).fetch(`https://do/user`, mutableReq)
    );

    res.headers.set('Cache-Control', CACHE_CONTROL_NO_STORE);

    return res;
  }
);

export default start(API.run);

export * from './do';
