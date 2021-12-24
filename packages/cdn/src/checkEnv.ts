// production時にはwebpackに削除してもらいたいので、愚直な比較を連ねる
// （正直実行時エラー出るので比較すら要らないが）

if (
  false ||
  !SECRET_CACHE_SECURITY_KEY ||
  !SECRET_STORAGE_ACCESS_USER_AGENT ||
  !SECRET_JWK_PUBLIC_KEY_SPKI_ARRAY
) {
  throw new Error('env variable not defined');
}
