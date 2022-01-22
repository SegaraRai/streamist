if (process.env.MINIFLARE === '1') {
  require('./build.dev');
} else {
  require('./build.prod');
}
