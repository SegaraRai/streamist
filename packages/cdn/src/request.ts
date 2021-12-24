import { corsAllowedOrigin } from './config';

/**
 * リクエストにX-Requested-Withヘッダーが含まれているか調べる
 * @param request 検査するリクエスト
 * @returns X-Requested-Withヘッダーが含まれていれば`true`、含まれていなければ`false`
 */
export function hasXRequestedWith(request: Request): boolean {
  return request.headers.has('X-Requested-With');
}

/**
 * 許可されたオリジンからのリクエストかどうかをOriginヘッダーの値から判別する \
 * Originヘッダーがない場合は許可されているものとみなす
 * @param request 検査するリクエスト
 * @returns 許可されているオリジンなら`true`、されていないオリジンなら`false`
 */
export function isAllowedOriginRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');
  return origin == null || origin === corsAllowedOrigin;
}
