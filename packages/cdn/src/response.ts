import {
  corsAllowedHeaders,
  corsAllowedMethods,
  corsHeaders,
  corsMaxAge,
} from './config';
import { sortHeaders } from './header';
import type { JWTCheckResult } from './jwtStore';

// new Responseはリクエストの処理中にしか呼べないらしいので、事前に生成するのではなく生成用の関数を用意するようにする

export interface ResponseOptions {
  headers$$q?: [string, string][];
}

/**
 * `fetch`で得られる`Response`はimmutableで`headers`等を変更できないので、変更可能な`Response`を再作成する \
 * cf. https://developers.cloudflare.com/workers/examples/alter-headers
 * @param originalResponse `fetch`で得られた`Response`
 * @returns `originalResponse`と同じ内容を持ったmutableな`Response`
 */
export function convertToMutableResponse(originalResponse: Response): Response {
  return new Response(originalResponse.body, originalResponse);
}

const errorResponseHeaders = /* @__PURE__*/ sortHeaders([
  ...corsHeaders,
  ['Cache-Control', 'no-store'],
  ['Content-Type', 'text/plain; charset=UTF-8'],
]);

function createResponse(
  status: number,
  statusText: string,
  options?: ResponseOptions
): Response {
  options = options || {};
  return new Response(statusText, {
    status,
    statusText,
    headers: sortHeaders([
      ...errorResponseHeaders,
      ...(options.headers$$q || []),
    ]),
  });
}

/**
 * 400 Bad Requestのレスポンスを生成して返す
 * @returns 400 Bad Requestのレスポンス
 */
export function createResponseBadRequest(options?: ResponseOptions): Response {
  return createResponse(400, 'Bad Request', options);
}

/**
 * 401 Unauthorizedのレスポンスを生成して返す
 * @returns 401 Unauthorizedのレスポンス
 */
export function createResponseUnauthorized(
  options?: ResponseOptions
): Response {
  return createResponse(401, 'Unauthorized', options);
}

/**
 * 403 Forbiddenのレスポンスを生成して返す
 * @returns 403 Forbiddenのレスポンス
 */
export function createResponseForbidden(options?: ResponseOptions): Response {
  return createResponse(403, 'Forbidden', options);
}

/**
 * 404 Not Foundのレスポンスを生成して返す
 * @returns 404 Not Foundのレスポンス
 */
export function createResponseNotFound(options?: ResponseOptions): Response {
  return createResponse(404, 'Not Found', options);
}

/**
 * 500 Internal Server Errorのレスポンスを生成して返す
 * @returns 500 Internal Server Errorのレスポンス
 */
export function createResponseInternalServerError(
  options?: ResponseOptions
): Response {
  return createResponse(500, 'Internal Server Error', options);
}

/**
 * 503 Service Unavailableのレスポンスを生成して返す
 * @returns 503 Service Unavailableのレスポンス
 */
export function createResponseServiceUnavailable(
  options?: ResponseOptions
): Response {
  return createResponse(503, 'Service Unavailable', options);
}

/**
 * CORSプリフライトリクエスト用のレスポンスを生成する \
 * CORSプリフライトリクエストかどうかはメソッドがOPTIONSかどうかで判断し、この関数に渡すリクエストはOPTIONSメソッドのものでなければならない \
 * 要求されたメソッドやヘッダーが許可されていれば正常系のレスポンスを、そうでなければ異常系のレスポンスを生成して返す
 * @param request CORSプリフライトリクエスト（OPTIONSメソッドのもの）
 * @returns CORSプリフライトリクエスト用のレスポンス
 */
export function createCORSPreflightResponse(
  request: Request,
  validationResult?: JWTCheckResult
): Response {
  // 要求に沿わなければエラーを返す

  const { headers: requestHeaders } = request;

  const corsAllowedHeadersLCSet = new Set<string>(
    corsAllowedHeaders.map((value) => value.toLowerCase())
  );
  const corsAllowedMethodsUCSet = new Set<string>(
    corsAllowedMethods.map((value) => value.toUpperCase())
  );

  // メソッドの確認

  const requestMethod = requestHeaders.get('Access-Control-Request-Method');

  if (!requestMethod) {
    return createResponseForbidden();
  }

  if (!corsAllowedMethodsUCSet.has(requestMethod.toUpperCase())) {
    return createResponseForbidden();
  }

  // ヘッダーの確認

  const accessControlRequestHeaders = (
    requestHeaders.get('Access-Control-Request-Headers') || ''
  )
    .split(',')
    .map((headerName) => headerName.trim());

  for (const headerName of accessControlRequestHeaders) {
    if (!corsAllowedHeadersLCSet.has(headerName.toLowerCase())) {
      return createResponseForbidden();
    }
  }

  // OK

  const responseHeaders: [string, string][] = [
    ...corsHeaders,
    ['Access-Control-Allow-Headers', corsAllowedHeaders.join(', ')],
    ['Access-Control-Allow-Methods', corsAllowedMethods.join(', ')],
    ['Access-Control-Max-Age', corsMaxAge.toString()],
  ];

  if (validationResult) {
    responseHeaders.push(['X-JWT-Validation-Cache', validationResult]);
  }

  return new Response(null, {
    status: 204,
    statusText: 'No Content',
    headers: sortHeaders(responseHeaders),
  });
}
