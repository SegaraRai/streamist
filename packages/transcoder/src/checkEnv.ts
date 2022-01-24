// production時にはwebpackに削除してもらいたいので、愚直な比較を連ねる

if (
  !process.env.SECRET_TRANSCODER_CALLBACK_SECRET ||
  !process.env.SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID ||
  !process.env.SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
) {
  throw new Error('env variable not defined');
}

export {};
