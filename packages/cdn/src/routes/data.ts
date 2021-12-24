import {
  getTranscodedAudioFileStorageURL,
  getTranscodedImageFileStorageURL,
} from '@streamist/shared-private/lib/storageURL';
import {
  DataTypeDirectory,
  noCacheKey,
  noCacheValue,
} from '@streamist/shared/lib/config/cdnURL';
import { parse as parseCookie } from 'cookie';
import {
  cacheTTL,
  cacheVersion,
  cookieJWTKey,
  corsHeaders,
  dataTypeDirectorySet,
} from '../config';
import { sortHeaders } from '../header';
import { calculateHMAC } from '../hmac';
import { parse as parseJWT } from '../jwt';
import { checkAndStoreJWT } from '../jwtStore';
import { isAllowedOriginRequest } from '../request';
import {
  ResponseOptions,
  convertToMutableResponse,
  createCORSPreflightResponse,
  createResponseForbidden,
  createResponseInternalServerError,
  createResponseNotFound,
  createResponseServiceUnavailable,
  createResponseUnauthorized,
} from '../response';

/**
 * /data/以下を処理するハンドラー
 * @param request リクエスト
 * @returns レスポンス
 */
export async function handleData(request: Request): Promise<Response> {
  if (!isAllowedOriginRequest(request)) {
    return createResponseForbidden();
  }

  const { headers: requestHeaders } = request;

  const url = new URL(request.url);

  // /data/<dataType>/<filename>
  const match = url.pathname.match(/^\/data\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return createResponseNotFound();
  }

  const [, dataType, filename] = match;

  if (!dataTypeDirectorySet.has(dataType as DataTypeDirectory)) {
    return createResponseNotFound();
  }

  const filenameWithoutExtension = filename.replace(/\.[\da-z]+$/, '');

  if (/[^\da-z]/.test(filenameWithoutExtension)) {
    return createResponseNotFound();
  }

  // parse JWT and get userId

  const cookie = requestHeaders.get('Cookie');
  if (!cookie) {
    return createResponseUnauthorized();
  }

  const strJWT = parseCookie(cookie)[cookieJWTKey] || '';
  if (!strJWT) {
    return createResponseUnauthorized();
  }

  const jwt = parseJWT(strJWT);
  if (!jwt) {
    return createResponseUnauthorized();
  }

  const validationResult = await checkAndStoreJWT(strJWT, jwt);
  if (!validationResult) {
    return createResponseUnauthorized();
  }

  const userId = jwt.payload$$q.sub;
  if (!userId || /[^\da-z]/.test(userId)) {
    return createResponseUnauthorized();
  }

  // respond the file on the storage

  let storageURL: string | undefined;

  try {
    switch (dataType as DataTypeDirectory) {
      case 'audio':
        storageURL = getTranscodedAudioFileStorageURL(
          userId,
          filenameWithoutExtension
        );
        break;

      case 'images':
        storageURL = getTranscodedImageFileStorageURL(
          userId,
          filenameWithoutExtension
        );
        break;
    }
  } catch (_error) {
    // do nothing
  }

  // 不正なデータセンターコードで`getTranscodedAudioFileStorageURL`ないし`getTranscodedImageFileStorageURL`で例外が投げられた等
  if (!storageURL) {
    return createResponseNotFound();
  }

  // handle CORS preflight request
  if (request.method.toUpperCase() === 'OPTIONS') {
    return createCORSPreflightResponse(request, validationResult);
  }

  // キャッシュしない設定か確認
  // 将来のための拡張用
  const noCache = url.searchParams.get(noCacheKey) === noCacheValue;

  // ETag計算
  const eTag = `"${userId}.${filenameWithoutExtension}"`;

  // クライアントにキャッシュが存在する場合は304 Not Modifiedを返す
  {
    const ifNoneMatchHeader = requestHeaders.get('If-None-Match') || '';
    // 厳密にはETagに,が含まれている場合を考慮すると正しくないが、仮にそのようなものが送られてきたとしても基本誤判定は発生しないためこれで良いものとする
    const requestETags = ifNoneMatchHeader.split(/,\s*/);
    if (requestETags.includes(eTag) || requestETags.includes('*')) {
      return new Response(null, {
        status: 304,
        statusText: 'Not Modified',
        headers: corsHeaders,
      });
    }
  }

  // キャッシュ対策の値を計算
  const securityTokenBase = [
    `${storageURL}?v=${cacheVersion}`,
    noCache ? '&nc' : '',
  ].join('');
  const fullSecurityToken = await calculateHMAC(securityTokenBase);
  const securityTokenQuery = fullSecurityToken.slice(0, 32);
  const securityTokenHeader = fullSecurityToken.slice(-32);

  const originRequestHeaders: [string, string][] = [
    // UAはアクセス制御（バケットポリシーでこのUAでないとアクセスできなくしてある）
    ['User-Agent', SECRET_STORAGE_ACCESS_USER_AGENT],
    // こっちはキャッシュ対策
    ['X-CDN-Cache-Security-Header', securityTokenHeader],
  ];

  // Rangeリクエストヘッダーが指定された場合、オリジンサーバーへのリクエストヘッダーにも同じものを付加する
  const rangeHeader = requestHeaders.get('Range');
  if (rangeHeader) {
    originRequestHeaders.push(['Range', rangeHeader]);
  }

  // オリジンサーバーへのリクエストを作成
  const originRequest = new Request(
    `${storageURL}?_csq=${securityTokenQuery}&response-Cache-Control=immutable%2C%20max-age%3D${cacheTTL}%2C%20public&response-Vary=User-Agent%2C%20X-CDN-Cache-Security-Header`,
    {
      method: request.method,
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
            cacheTtl: cacheTTL,
          },
      headers: originRequestHeaders,
    }
  );

  const timestampBeforeRequest = Date.now();

  // オリジンサーバーにリクエストを送信し、レスポンスを取得
  // レスポンスボディはデフォルトでストリームされる
  const originResponse = convertToMutableResponse(await fetch(originRequest));

  const timestampAfterRequest = Date.now();

  // レスポンスヘッダーを修正

  const {
    headers: responseHeaders,
    ok: responseOk,
    status: responseStatus,
  } = originResponse;

  responseHeaders.delete('Cache-Control');
  responseHeaders.delete('ETag');
  responseHeaders.delete('Vary');

  for (const [key, value] of corsHeaders) {
    responseHeaders.set(key, value);
  }

  responseHeaders.set(
    'Cache-Control',
    responseOk ? `immutable, max-age=${cacheTTL}, private` : 'no-store'
  );

  if (responseOk) {
    responseHeaders.set('ETag', eTag);
  }

  // NOTE: Cache-Controlにprivateを指定しておりクライアント端末でのみキャッシュされることが期待できるため、VaryにCookieは指定しない
  responseHeaders.set('Vary', 'Origin');

  // キャッシュ効果の測定用
  responseHeaders.set('X-JWT-Validation-Cache-Status', validationResult);

  // レスポンスタイムの測定用
  responseHeaders.set(
    'X-Origin-Response-Time',
    (timestampAfterRequest - timestampBeforeRequest).toString()
  );

  // 失敗した場合はこちらでレスポンスを作成して返す
  if (!responseOk) {
    const options: ResponseOptions = {
      headers$$q: [['X-Origin-Status', `${responseStatus}`]],
    };

    // 404 -> 404
    if (responseStatus === 404) {
      return createResponseNotFound(options);
    }

    // 503 -> 503
    if (responseStatus === 503) {
      return createResponseServiceUnavailable(options);
    }

    // other (4xx and 5xx) -> 500
    return createResponseInternalServerError(options);
  }

  // ヘッダーをソート
  const headerSortedResponse = new Response(originResponse.body, {
    ...originResponse,
    headers: sortHeaders(Array.from(responseHeaders.entries())),
  });

  return headerSortedResponse;
}
