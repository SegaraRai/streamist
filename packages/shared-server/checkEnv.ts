// production時にはwebpackに削除してもらいたいので、愚直な比較を連ねる

if (
  !process.env.SECRET_WASABI_ACCESS_KEY_ID ||
  !process.env.SECRET_WASABI_SECRET_ACCESS_KEY
) {
  throw new Error('env variable not defined');
}
