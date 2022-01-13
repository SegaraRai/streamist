import './initOS';

import { parse, serialize } from 'cookie';
import { Router } from 'worktop';
import * as CORS from 'worktop/cors';
import { reply } from 'worktop/module';
import { send } from 'worktop/response';
import { isId } from '$shared/id';
import {
  getOSRawURL,
  getTranscodedAudioFileKey,
  getTranscodedAudioFileOS,
  getTranscodedImageFileKey,
  getTranscodedImageFileOS,
  isValidOSRegion,
} from '$shared/objectStorage';
import {
  CACHE_TTL,
  CACHE_VERSION,
  COOKIE_EXPIRY_DELAY,
  COOKIE_JWT_KEY,
  CORS_MAX_AGE,
} from './config';
import { calculateHMAC } from './hmac';
import { verifyJWT } from './jwt';
import { convertToMutableResponse } from './response';
import type { Bindings } from './types';

const API = new Router<Bindings>();

API.prepare = (req, context) => {
  return CORS.preflight({
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    headers: ['Authorization', 'Cache-Control', 'Content-Type'],
    origin: context.bindings.APP_ORIGIN,
    credentials: true,
    maxage: CORS_MAX_AGE,
  })(req, context as any);
};

API.add('POST', '/api/cookies/token', async (req, context) => {
  if (req.headers.get('Origin') !== context.bindings.APP_ORIGIN) {
    return send(403);
  }

  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return send(401);
  }

  const strJWT = auth.slice(7).trim();

  const jwt = await verifyJWT(strJWT, context);

  if (!jwt || jwt.aud !== 'cdn') {
    return send(401);
  }

  return send(204, '', {
    'Cache-Control': 'no-store',
    'Set-Cookie': serialize(COOKIE_JWT_KEY, strJWT, {
      expires: new Date((jwt.exp! + COOKIE_EXPIRY_DELAY) * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    }),
  });
});

API.add('DELETE', '/api/cookies/token', (req, context) => {
  if (req.headers.get('Origin') !== context.bindings.APP_ORIGIN) {
    return send(403);
  }

  return send(204, '', {
    'Cache-Control': 'no-store',
    Cookie: serialize(COOKIE_JWT_KEY, '', {
      expires: new Date(0), // 1970-01-01T00:00:00.000Z
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    }),
  });
});

API.add(
  'GET',
  '/files/:region/:type/:userId/:entityId/:filename',
  async (req, context) => {
    const strJWT = parse(req.headers.get('Cookie') || '')[COOKIE_JWT_KEY];
    if (!strJWT) {
      return send(401);
    }

    const jwt = await verifyJWT(strJWT, context);
    if (!jwt || jwt.aud !== 'cdn') {
      return send(401);
    }

    const { entityId, filename, region, type, userId } = context.params;

    if (jwt.sub !== userId) {
      return send(401);
    }

    if (!isValidOSRegion(region)) {
      return send(404);
    }

    if (!isId(entityId)) {
      return send(404);
    }

    const match = filename.match(/([^.]+)(\.[\da-z]+)$/);
    if (!match) {
      return send(404);
    }

    const [, fileId, extension] = match;
    if (!isId(fileId)) {
      return send(404);
    }

    let storageURL: string | undefined;
    const getOSURL = getOSRawURL;
    switch (type) {
      case 'audios':
        storageURL = getOSURL(
          getTranscodedAudioFileOS(region),
          getTranscodedAudioFileKey(userId, entityId, fileId, extension)
        );
        break;

      case 'images':
        storageURL = getOSURL(
          getTranscodedImageFileOS(region),
          getTranscodedImageFileKey(userId, entityId, fileId, extension)
        );
        break;
    }

    // キャッシュしない設定か確認
    // 将来のための拡張用
    const noCache = context.url.searchParams.get('nc') === '1';

    // ETag計算
    const eTag = `"${userId}.${filename}"`;

    // クライアントにキャッシュが存在する場合は304 Not Modifiedを返す
    {
      const ifNoneMatchHeader = req.headers.get('If-None-Match') || '';
      // 厳密にはETagに,が含まれている場合を考慮すると正しくないが、仮にそのようなものが送られてきたとしても基本誤判定は発生しないためこれで良いものとする
      const requestETags = ifNoneMatchHeader.split(/,\s*/);
      if (requestETags.includes(eTag) || requestETags.includes('*')) {
        return send(304);
      }
    }

    // キャッシュ対策の値を計算
    const securityTokenBase = [
      `${storageURL}?v=${CACHE_VERSION}`,
      noCache ? '&nc' : '',
    ].join('');
    const fullSecurityToken = await calculateHMAC(
      context.bindings.SECRET_CACHE_SECURITY_KEY,
      securityTokenBase
    );
    const securityTokenQuery = fullSecurityToken.slice(0, 64);
    const securityTokenHeader = fullSecurityToken.slice(64, 64);

    const originRequestHeaders: [string, string][] = [
      // Refererはアクセス制御（バケットポリシーでこのRefererでないとアクセスできなくしてある）
      ['Referer', context.bindings.SECRET_STORAGE_ACCESS_REFERER],
      // こっちはキャッシュ対策
      ['X-CDN-Cache-Security-Header', securityTokenHeader],
    ];

    // Rangeリクエストヘッダーが指定された場合、オリジンサーバーへのリクエストヘッダーにも同じものを付加する
    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      originRequestHeaders.push(['Range', rangeHeader]);
    }

    // オリジンサーバーへのリクエストを作成
    const originRequest = new Request(
      `${storageURL}?_csq=${securityTokenQuery}&response-Cache-Control=immutable%2C%20max-age%3D${CACHE_TTL}%2C%20public&response-Vary=Referer%2C%20User-Agent%2C%20X-CDN-Cache-Security-Header`,
      {
        method: req.method,
        cf: noCache
          ? {
              cacheEverything: false,
            }
          : {
              // NOTE: キャッシュについて
              // Cloudflare側でキャッシュを有効にした場合、クライアントからRangeリクエストが行われようとすべてのデータをダウンロードする模様
              // そのため、特に巨大なファイルで後ろの方のRangeリクエストが行われた場合、クライアントはレスポンスの到着を待たされることになる
              // 一方で、キャッシュを無効化する場合、単純にクライアントからのリクエストごとにオリジンサーバーまでリクエストが飛ぶためレスポンスが悪くなる
              // （キャッシュを有効化した場合と無効化した場合で動画ファイルのシークにかかる時間が異なった）
              // ここでは、それぞれのファイルが小さいことから、キャッシュを有効化することとしている
              cacheEverything: true,
              cacheTtl: CACHE_TTL,
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
        'X-Origin-Status': responseStatus.toString(),
        'X-Origin-Response-Time':
          timestampAfterRequest - timestampBeforeRequest,
        'Cache-Control': 'no-store',
      };

      // 404 -> 404
      if (responseStatus === 404) {
        return send(404, null, errorHeaders);
      }

      // 503 -> 503
      if (responseStatus === 503) {
        return send(503, null, errorHeaders);
      }

      // other (4xx and 5xx) -> 500
      return send(500, null, errorHeaders);
    }

    // レスポンスヘッダーを修正

    responseHeaders.delete('Cache-Control');
    responseHeaders.delete('ETag');
    responseHeaders.delete('Vary');

    responseHeaders.set(
      'Cache-Control',
      responseOk ? `immutable, max-age=${CACHE_TTL}, private` : 'no-store'
    );

    if (responseOk) {
      responseHeaders.set('ETag', eTag);
    }

    // NOTE: Cache-Controlにprivateを指定しておりクライアント端末でのみキャッシュされることが期待できるため、VaryにCookieは指定しない
    responseHeaders.set('Vary', 'Origin');

    // レスポンスタイムの測定用
    responseHeaders.set(
      'X-Origin-Response-Time',
      (timestampAfterRequest - timestampBeforeRequest).toString()
    );

    return originResponse;
  }
);

export default reply(API.run);
