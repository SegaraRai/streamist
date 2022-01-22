const { build } = require('esbuild');

const { NODE_ENV } = process.env;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV must be 'production' or 'development'`);
}

build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index.js',
  platform: 'neutral',
  bundle: true,
  minify: true,
  logLevel: 'info',
  define: {
    NODE_ENV: `"${NODE_ENV}"`,
  },
});
