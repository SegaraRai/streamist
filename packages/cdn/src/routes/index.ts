import { cookieAPI } from '@streamist/shared/lib/config/cdnURL';
import { createResponseNotFound } from '../response';
import { Router } from '../router';
import { handleAPICookie } from './api/cookie';
import { handleData } from './data';

const router = /*@__PURE__*/ new Router()
  .options$$q(cookieAPI, handleAPICookie)
  .post$$q(cookieAPI, handleAPICookie)
  .get$$q(/^\/data\//, handleData)
  .head$$q(/^\/data\//, handleData)
  .options$$q(/^\/data\//, handleData)
  .all$$q(() => createResponseNotFound());

/**
 * リクエストのハンドラー
 * @param event イベント
 * @returns レスポンス
 */
export function handler(event: FetchEvent): Response | Promise<Response> {
  return router.route$$q(event.request);
}
