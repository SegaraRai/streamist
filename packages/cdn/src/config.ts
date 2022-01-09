/**
 * JWTを格納するCookieのキー
 */
export const COOKIE_JWT_KEY = 'token' as const;

/**
 * Cookieの生存期間の追加の猶予（秒） \
 * クライアントの時間が多少ずれていても良いように \
 * 多少長めにとっておいても問題ない \
 * （リフレッシュはクライアント側でAPIサーバー用のものと同時に適当なタイミングで行われるはず、行われなくても期限切れのものは検証で弾かれる）
 */
export const COOKIE_EXPIRY_DELAY = 50 * 60;

/**
 * キャッシュのバージョン（文字列） \
 * 何らかの理由で過去のキャッシュをすべて用いたくなくなった場合はこの値を変更する \
 * 文字列はなんでもよい \
 * 特にエンドユーザーに露出はしない
 */
export const CACHE_VERSION = '20211223' as const;

/**
 * レスポンスのキャッシュの有効期限（immutableをサポートしていないブラウザ用） \
 * in seconds, 1000 days
 */
export const CACHE_TTL = 1000 * 24 * 60 * 60;

/**
 * CORSのAccess-Control-Max-Ageに指定する値 \
 * in seconds, 24 hours \
 * ブラウザによっても上限が設定されている
 */
export const CORS_MAX_AGE = 24 * 60 * 60;
