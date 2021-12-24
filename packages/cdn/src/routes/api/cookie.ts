import { serialize as serializeCookie } from 'cookie';
import { cookieExpiryDelay, cookieJWTKey, corsHeaders } from '../../config';
import { sortHeaders } from '../../header';
import { parse as parseJWT } from '../../jwt';
import { checkAndStoreJWT } from '../../jwtStore';
import { hasXRequestedWith, isAllowedOriginRequest } from '../../request';
import {
  createCORSPreflightResponse,
  createResponseBadRequest,
  createResponseForbidden,
  createResponseUnauthorized,
} from '../../response';

/**
 * /api/v1/cookieを処理するハンドラー
 * @param request リクエスト
 * @returns レスポンス
 */
export async function handleAPICookie(request: Request): Promise<Response> {
  // validate JWT in Authorization header and set Cookie

  // check X-Requested-With header
  if (!hasXRequestedWith(request)) {
    return createResponseForbidden();
  }

  // check Origin header
  if (!isAllowedOriginRequest(request)) {
    return createResponseForbidden();
  }

  // handle CORS preflight request
  if (request.method.toUpperCase() === 'OPTIONS') {
    return createCORSPreflightResponse(request);
  }

  const baseHeaders: (readonly [string, string])[] = [
    ...corsHeaders,
    ['Cache-Control', 'no-store'],
  ];

  // get action
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  switch (action) {
    case 'clear':
      return new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: sortHeaders([
          ...baseHeaders,
          [
            'Cookie',
            serializeCookie(cookieJWTKey, '', {
              expires: new Date(0), // 1970-01-01T00:00:00.000Z
              httpOnly: true,
              sameSite: 'none',
              secure: true,
            }),
          ],
        ]) as [string, string][],
      });

    case 'set': {
      // get Authorization header value
      const authorization = request.headers.get('Authorization');
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return createResponseUnauthorized();
      }

      // get JWT string
      const strJWT = authorization.substr(7).trim();
      if (!strJWT) {
        return createResponseUnauthorized();
      }

      // parse JWT
      const jwt = parseJWT(strJWT);
      if (!jwt) {
        return createResponseUnauthorized();
      }

      // check if JWT is valid
      const validationResult = await checkAndStoreJWT(strJWT, jwt);
      if (!validationResult) {
        return createResponseUnauthorized();
      }

      // set cookie
      return new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: sortHeaders([
          ...baseHeaders,
          [
            'Cookie',
            serializeCookie(cookieJWTKey, strJWT, {
              expires: new Date(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (jwt.payload$$q.exp! + cookieExpiryDelay) * 1000
              ),
              httpOnly: true,
              sameSite: 'none',
              secure: true,
            }),
          ],
          ['X-JWT-Validation-Cache', validationResult],
        ]),
      });
    }
  }

  return createResponseBadRequest();
}
