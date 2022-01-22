const { build } = require('esbuild');
const alias = require('esbuild-plugin-alias');

const { NODE_ENV } = process.env;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV must be 'production' or 'development'`);
}

build({
  entryPoints: ['./entrypoints/index.ts'],
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node16',
  bundle: true,
  logLevel: 'info',
  plugins: [
    alias({
      '.prisma/client/index': require.resolve('.prisma/client/index'),
    }),
  ],
  define: {
    'process.env.NODE_ENV': `"${NODE_ENV}"`,
  },
});
