import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
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
    tsPaths({
      tsConfigPath: ['tsconfig.json', '../shared/tsconfig.json'],
    }),
    nodeResolve({
      browser: true,
      extensions: ['.ts', '.js', '.json'],
    }),
    esbuild({
      minify: false,
      define: {
        'BUILD_TIME_DEFINITION.NODE_ENV': `"${NODE_ENV}"`,
      },
    }),
    commonjs(),
    terser(),
  ],
});
