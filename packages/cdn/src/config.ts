import type { DataTypeDirectory } from '$shared/config/cdnURL';
import { appDomain } from '$shared/config/domains';

/**
 * JWTを格納するCookieのキー
 */
export const cookieJWTKey = 'token' as const;

/**
 * Cookieの生存期間の追加の猶予（秒） \
 * クライアントの時間が多少ずれていても良いように \
 * 多少長めにとっておいても問題ない \
 * （リフレッシュはクライアント側でAPIサーバー用のものと同時に適当なタイミングで行われるはず、行われなくても期限切れのものは検証で弾かれる）
 */
export const cookieExpiryDelay = 50 * 60;

/**
 * キャッシュのバージョン（文字列） \
 * 何らかの理由で過去のキャッシュをすべて用いたくなくなった場合はこの値を変更する \
 * 文字列はなんでもよい \
 * 特にエンドユーザーに露出はしない
 */
export const cacheVersion = '20211223' as const;

/**
 * レスポンスのキャッシュの有効期限（immutableをサポートしていないブラウザ用） \
 * in seconds, 1000 days
 */
export const cacheTTL = 1000 * 24 * 60 * 60;

/**
 * CORSのAccess-Control-Max-Ageに指定する値 \
 * in seconds, 24 hours \
 * ブラウザによっても上限が設定されている
 */
export const corsMaxAge = 24 * 60 * 60;

/**
 * CORSにおいて許可されるオリジン
 */
export const corsAllowedOrigin = `https://${appDomain}`;

/**
 * CORSにおいて許可されるリクエストヘッダーの配列
 */
export const corsAllowedHeaders: readonly string[] = [
  'Accept',
  'Authorization',
  'Content-Type',
  'X-Requested-With',
];

/**
 * CORSにおいて許可されるメソッドの配列
 */
export const corsAllowedMethods: readonly string[] = [
  'GET',
  'HEAD',
  'OPTIONS',
  'POST',
];

/**
 * CORSにおいて露出するレスポンスヘッダーの配列
 */
export const corsExposeHeaders: readonly string[] = [
  'ETag',
  // 'Retry-After',
  'X-JWT-Validation-Cache-Status',
  // 'X-Ratelimit-Limit',
  // 'X-Ratelimit-Remaining',
  // 'X-Ratelimit-Reset',
];

/**
 * CORS用のヘッダー
 */
export const corsHeaders: readonly (readonly [string, string])[] = [
  ['Access-Control-Allow-Credentials', 'true'],
  ['Access-Control-Allow-Origin', corsAllowedOrigin],
  [
    'Access-Control-Expose-Headers',
    /* @__PURE__*/ corsExposeHeaders.join(', '),
  ],
  ['Vary', 'Origin'],
];

/**
 * データディレクトリ以下のデータ種類ごとのディレクトリ名のセット \
 * つまり、URLパスの/data/:type/:idにおいて:typeとして存在しうる値のセット
 */
export const dataTypeDirectorySet: ReadonlySet<string> =
  /* @__PURE__*/ new Set<DataTypeDirectory>(['audio', 'images']);
