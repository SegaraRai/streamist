import './initOS';

import { parse, serialize } from 'cookie';
import { Router } from 'worktop';
import { start } from 'worktop/cfw';
import * as CORS from 'worktop/cors';
import { reply } from 'worktop/response';
import {
  getOSRawURL,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
  isValidOSRegion,
} from '$shared-server/objectStorage';
import { arrayBufferToHex } from '$shared/arrayBufferToHex';
import {
  CACHE_CONTROL_IMMUTABLE_TTL,
  CACHE_CONTROL_NO_STORE,
  CACHE_CONTROL_PRIVATE_IMMUTABLE,
  CACHE_CONTROL_PUBLIC_IMMUTABLE,
  JWT_CDN_TOKEN_AUD,
} from '$shared/config';
import { isId } from '$shared/id';
import {
  CACHE_VERSION,
  COOKIE_EXPIRY_DELAY,
  COOKIE_TOKEN_KEY,
  CORS_MAX_AGE,
  ETAG_VERSION,
} from './config';
import { calculateHMAC } from './hmac';
import { JWTPayload, verifyJWT } from './jwt';
import { convertToMutableResponse } from './response';
import type { Bindings } from './types';

const NO_CACHE_HEADERS = {
  'Cache-Control': CACHE_CONTROL_NO_STORE,
} as const;

const COOKIE_OPTIONS_BASE = {
  expires: new Date(0),
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  path: '/',
} as const;

function getAppOrigin(
  req: Request,
  context: Pick<Bindings, 'bindings' | 'url'>
): string {
  return BUILD_TIME_DEFINITION.NODE_ENV === 'development' &&
    context.bindings.DEV_CDN_SKIP_ORIGIN_CHECK === '1'
    ? req.headers.get('Origin') || context.url.origin
    : context.bindings.APP_ORIGIN;
}

//

const API = new Router<Bindings>();

API.prepare = (req, context) => {
  context.defer((res): void => {
    res.headers.set('Streamist-Revision-CDN', BUILD_TIME_DEFINITION.BUILD_REV);
  });
  return CORS.preflight({
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    headers: ['Authorization', 'Cache-Control', 'Content-Type'],
    origin: /* #__PURE__ */ getAppOrigin(req, context),
    credentials: true,
    maxage: CORS_MAX_AGE,
  })(req, context as any);
};

API.add('POST', '/api/cookies/token', async (req, context) => {
  // Origin is required here
  if (
    req.headers.get('Origin') !== /* #__PURE__ */ getAppOrigin(req, context)
  ) {
    return reply(403, 'Invalid origin', NO_CACHE_HEADERS);
  }

  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply(401, 'Malformed token', NO_CACHE_HEADERS);
  }

  const strJWT = auth.slice(7).trim();

  const jwt = await verifyJWT(strJWT, context);

  if (!jwt || jwt.aud !== JWT_CDN_TOKEN_AUD) {
    return reply(401, 'Invalid token', NO_CACHE_HEADERS);
  }

  const referrerSpec = req.headers.get('Referer') ? 'r1' : 'r0';

  const token = `${strJWT}~${referrerSpec}`;

  return reply(204, null, {
    ...NO_CACHE_HEADERS,
    'Set-Cookie': serialize(COOKIE_TOKEN_KEY, token, {
      ...COOKIE_OPTIONS_BASE,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expires: new Date((jwt.exp! + COOKIE_EXPIRY_DELAY) * 1000),
    }),
  });
});

API.add('DELETE', '/api/cookies/token', (req, context) => {
  // Origin is required here
  if (
    req.headers.get('Origin') !== /* #__PURE__ */ getAppOrigin(req, context)
  ) {
    return reply(403, null, NO_CACHE_HEADERS);
  }

  return reply(204, null, {
    ...NO_CACHE_HEADERS,
    'Set-Cookie': serialize(COOKIE_TOKEN_KEY, '', COOKIE_OPTIONS_BASE),
  });
});

API.add(
  'GET',
  '/files/:region/:type/:userId/:entityId/:filename',
  async (req, context) => {
    const { entityId, filename, region, type, userId } = context.params;

    const appOrigin = /* #__PURE__ */ getAppOrigin(req, context);
    const expectedReferrerPrefix = `${appOrigin}/`;

    // check Origin if set
    if (req.headers.has('Origin') && req.headers.get('Origin') !== appOrigin) {
      return reply(403, null, NO_CACHE_HEADERS);
    }

    const cookies = parse(req.headers.get('Cookie') || '');
    const token = cookies[COOKIE_TOKEN_KEY] || '';

    const [strJWT = '', referrerSpec = ''] = token.split('~');

    // check Referer if Sec-Fetch-Site is cross-site (we send referrer)
    // though Sec-Fetch-Site will not be 'same-origin' or 'same-site' as there are no script in cdn domain, we permit those requests
    if (
      referrerSpec === 'r1' &&
      req.headers.get('Sec-Fetch-Site') === 'cross-site'
    ) {
      const referrer = req.headers.get('Referer') || '';
      if (
        referrer !== appOrigin &&
        !referrer.startsWith(expectedReferrerPrefix)
      ) {
        return reply(403, null, NO_CACHE_HEADERS);
      }
    }

    let jwt: JWTPayload;
    if (
      BUILD_TIME_DEFINITION.NODE_ENV === 'development' &&
      context.bindings.DEV_CDN_SKIP_COOKIE_AUTH === '1'
    ) {
      console.warn('Skipping cookie auth');

      jwt = {
        id: userId,
        aud: JWT_CDN_TOKEN_AUD,
        sub: userId,
        exp: 253370732400,
        iss: 'dev.streamist.app',
        plan: 'unlimited',
        maxTrackId: null,
      };
    } else {
      if (!strJWT) {
        return reply(401, 'Cookie not set', NO_CACHE_HEADERS);
      }

      const tempJWT = await verifyJWT(strJWT, context);
      if (!tempJWT || tempJWT.aud !== JWT_CDN_TOKEN_AUD) {
        return reply(401, 'Invalid cookie', NO_CACHE_HEADERS);
      }

      jwt = tempJWT;
    }

    if (jwt.sub !== userId) {
      return reply(401, 'Token subject mismatch', NO_CACHE_HEADERS);
    }

    if (!isValidOSRegion(region)) {
      return reply(404, 'Unknown region', NO_CACHE_HEADERS);
    }

    if (!isId(entityId)) {
      return reply(404, 'Malformed id', NO_CACHE_HEADERS);
    }

    const match = filename.match(/^([^.]+)(\.[\da-z]+)$/);
    if (!match) {
      return reply(404, 'Malformed filename', NO_CACHE_HEADERS);
    }

    const [, fileId, extension] = match;
    if (!isId(fileId)) {
      return reply(404, 'Malformed file id', NO_CACHE_HEADERS);
    }

    let storageURL: string | false | undefined;
    const getOSURL = getOSRawURL;
    switch (type) {
      case 'audios':
        if (jwt.maxTrackId && entityId > jwt.maxTrackId) {
          storageURL = false;
        } else {
          storageURL = getOSURL(
            getTranscodedAudioFileOS(region),
            getTranscodedAudioFileKey(userId, entityId, fileId, extension)
          );
        }
        break;

      case 'images':
        storageURL = getOSURL(
          getTranscodedImageFileOS(region),
          getTranscodedImageFileKey(userId, entityId, fileId, extension)
        );
        break;
    }

    if (!storageURL) {
      return reply(storageURL === false ? 403 : 404, null, NO_CACHE_HEADERS);
    }

    const cacheAll = type === 'images';

    // ETag計算
    const eTagBase = arrayBufferToHex(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(
          `${ETAG_VERSION}:${region}.${userId}.${entityId}.${filename}`
        )
      )
    );
    const eTag = `"${eTagBase}"`;

    // クライアントにキャッシュが存在する場合は304 Not Modifiedを返す
    {
      const ifNoneMatchHeader = req.headers.get('If-None-Match') || '';
      // 厳密にはETagに,が含まれている場合を考慮すると正しくないが、仮にそのようなものが送られてきたとしても基本誤判定は発生しないためこれで良いものとする
      const requestETags = ifNoneMatchHeader.split(/,\s*/);
      if (requestETags.includes(eTag) || requestETags.includes('*')) {
        return reply(304);
      }
    }

    // キャッシュ対策の値を計算
    const securityTokenBase = [
      `${storageURL}?v=${CACHE_VERSION}&c=${cacheAll ? 1 : 0}`,
    ].join('');
    const fullSecurityToken = await calculateHMAC(
      context.bindings.SECRET_CDN_CACHE_SECURITY_KEY_HMAC_SECRET,
      securityTokenBase
    );
    const securityTokenQuery = fullSecurityToken.slice(0, 64);
    const securityTokenHeader = fullSecurityToken.slice(64, 64);

    const originRequestHeaders: [string, string][] = [
      // Refererはアクセス制御（バケットポリシーでこのRefererでないとアクセスできなくしてある）
      ['Referer', context.bindings.SECRET_CDN_STORAGE_ACCESS_REFERRER],
      // こっちはキャッシュ対策
      ['Streamist-CDN-Cache-Security-Header', securityTokenHeader],
    ];

    // Rangeリクエストヘッダーが指定された場合、オリジンサーバーへのリクエストヘッダーにも同じものを付加する
    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      originRequestHeaders.push(['Range', rangeHeader]);
    }

    // オリジンサーバーへのリクエストを作成
    const originRequest = new Request(
      `${storageURL}?_csq=${securityTokenQuery}&response-Cache-Control=${encodeURIComponent(
        CACHE_CONTROL_PUBLIC_IMMUTABLE
      )}&response-Vary=Referer%2C%20User-Agent%2C%20Streamist-CDN-Cache-Security-Header`,
      {
        method: req.method,
        cf: cacheAll
          ? {
              // NOTE: キャッシュについて
              // Cloudflare側でキャッシュを有効にした場合、クライアントからRangeリクエストが行われようとすべてのデータをダウンロードする模様
              // そのため、特に巨大なファイルで後ろの方のRangeリクエストが行われた場合、クライアントはレスポンスの到着を待たされることになる
              // 一方で、キャッシュを無効化する場合、単純にクライアントからのリクエストごとにオリジンサーバーまでリクエストが飛ぶためレスポンスが悪くなる
              // （キャッシュを有効化した場合と無効化した場合で動画ファイルのシークにかかる時間が異なった）
              // ここでは、それぞれのファイルが小さいことから、キャッシュを有効化することとしている
              cacheEverything: true,
              cacheTtl: CACHE_CONTROL_IMMUTABLE_TTL,
            }
          : {
              cacheEverything: false,
            },
        headers: originRequestHeaders,
      }
    );

    const timestampBeforeRequest = Date.now();

    // オリジンサーバーにリクエストを送信し、レスポンスを取得
    // レスポンスボディはデフォルトでストリームされる
    const originResponse = convertToMutableResponse(await fetch(originRequest));

    const timestampAfterRequest = Date.now();

    const {
      headers: responseHeaders,
      ok: responseOk,
      status: responseStatus,
    } = originResponse;

    // 失敗した場合はこちらでレスポンスを作成して返す
    if (!responseOk) {
      const errorHeaders = {
        ...NO_CACHE_HEADERS,
        'Streamist-Origin-Status': responseStatus.toString(),
        'Streamist-Origin-Response-Time':
          timestampAfterRequest - timestampBeforeRequest,
      };

      // 404 -> 404
      if (responseStatus === 404) {
        return reply(404, null, errorHeaders);
      }

      // 503 -> 503
      if (responseStatus === 503) {
        return reply(503, null, errorHeaders);
      }

      // other (4xx and 5xx) -> 500
      return reply(500, null, errorHeaders);
    }

    // レスポンスヘッダーを修正

    responseHeaders.delete('Cache-Control');
    responseHeaders.delete('ETag');
    responseHeaders.delete('Server');
    responseHeaders.delete('Vary');

    responseHeaders.set('Cache-Control', CACHE_CONTROL_PRIVATE_IMMUTABLE);

    responseHeaders.set('ETag', eTag);

    // NOTE: Cache-Controlにprivateを指定しておりクライアント端末でのみキャッシュされることが期待できるため、VaryにCookieは指定しない
    responseHeaders.set(
      'Vary',
      'Origin, Referer, Sec-Fetch-Mode, Sec-Fetch-Site'
    );

    // レスポンスタイムの測定用
    responseHeaders.set(
      'Streamist-Origin-Response-Time',
      (timestampAfterRequest - timestampBeforeRequest).toString()
    );

    return originResponse;
  }
);

export default start(API.run);
