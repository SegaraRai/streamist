import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
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
    replace({
      'process.env.NODE_ENV': `"${NODE_ENV}"`,
      preventAssignment: true,
    }),
    // rollup fails to resolve $shared/retry imported from $shared-server when using esbuild plugin instead
    typescript({
      rootDir: '..',
    }),
    json(),
    tsPaths(),
    nodeResolve({
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      preferBuiltins: true,
    }),
    commonjs(),
    terser(),
  ],
});
