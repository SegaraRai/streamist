import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '$/': `${path.resolve(__dirname)}/`,
      '$prisma/': `${path.resolve(__dirname, './node_modules/.prisma')}/`,
      '.prisma/': `${path.resolve(__dirname, './node_modules/.prisma')}/`,
      '$shared/': `${path.resolve(__dirname, '../shared/src')}/`,
      '$shared-server/': `${path.resolve(__dirname, '../shared-server/src')}/`,
      'class-transformer/esm2015': `${path.resolve(
        __dirname,
        './node_modules/class-transformer/esm2015'
      )}/`,
      'class-transformer': `${path.resolve(
        __dirname,
        './node_modules/class-transformer/esm2015'
      )}/`,
    },
  },
});
