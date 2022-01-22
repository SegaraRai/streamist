import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import tsPaths from 'rollup-plugin-tsconfig-paths';

const { NODE_ENV = 'production' } = process.env;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV must be 'production' or 'development'`);
}

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  plugins: [
    replace({
      'BUILD_TIME_DEFINITION.NODE_ENV': `"${NODE_ENV}"`,
      preventAssignment: true,
    }),
    // NOTE: esbuild plugin does ont bundle or resolve dependencies
    esbuild({
      minify: false,
    }),
    tsPaths(),
    nodeResolve({ extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'] }),
    commonjs(),
    terser(),
  ],
});
