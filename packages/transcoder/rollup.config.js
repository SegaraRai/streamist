import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import tsPaths from 'rollup-plugin-tsconfig-paths';

const { NODE_ENV = 'production' } = process.env;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV must be 'production' or 'development'`);
}

export default defineConfig({
  input: 'src/indexLambda.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    inlineDynamicImports: true,
  },
  plugins: [
    tsPaths({
      // load other project's tsconfig.json
      // this is required to resolve child project dependencies (such as `$shared`) imported from project dependencies (such as $shared-server)
      tsConfigPath: [
        'tsconfig.json',
        '../shared/tsconfig.json',
        '../shared-server/tsconfig.json',
      ],
    }),
    nodeResolve({
      exportConditions: ['node'],
      extensions: ['.js', '.mjs', '.ts', '.json', '.node'],
      preferBuiltins: true,
    }),
    json({
      preferConst: true,
    }),
    esbuild({
      define: {
        'process.env.NODE_ENV': `"${NODE_ENV}"`,
      },
      minify: false,
    }),
    commonjs(),
    terser(),
  ],
});
