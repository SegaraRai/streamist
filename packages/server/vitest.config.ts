import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '$/': `${path.resolve(__dirname, '../server')}/`,
      '$prisma/': `${path.resolve(
        __dirname,
        '../server/node_modules/.prisma'
      )}/`,
      '.prisma/': `${path.resolve(
        __dirname,
        '../server/node_modules/.prisma'
      )}/`,
      '$shared/': `${path.resolve(__dirname, '../shared')}/`,
    },
  },
});
