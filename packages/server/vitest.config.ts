import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '$/': `${path.resolve(__dirname)}/`,
      '$prisma/': `${path.resolve(__dirname, './node_modules/.prisma')}/`,
      '.prisma/': `${path.resolve(__dirname, './node_modules/.prisma')}/`,
      '$shared/': `${path.resolve(__dirname, '../shared')}/`,
      'class-transformer/esm2015': 'class-transformer/esm2015',
      'class-transformer': 'class-transformer/esm2015',
    },
  },
});
