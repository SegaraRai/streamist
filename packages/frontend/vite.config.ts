import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import VueI18n from '@intlify/vite-plugin-vue-i18n';
import replace from '@rollup/plugin-replace';
import Vue from '@vitejs/plugin-vue';
import VueJSX from '@vitejs/plugin-vue-jsx';
import Vuetify from '@vuetify/vite-plugin';
import { config } from 'dotenv';
import fg from 'fast-glob';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import type {
  ComponentResolveResult,
  ComponentResolver,
} from 'unplugin-vue-components/types';
import Components from 'unplugin-vue-components/vite';
import { ProxyOptions, defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import Inspect from 'vite-plugin-inspect';
import Pages from 'vite-plugin-pages';
import { VitePWA } from 'vite-plugin-pwa';
import Layouts from 'vite-plugin-vue-layouts';
import WindiCSS from 'vite-plugin-windicss';
import { COLOR_CSS_VAR_MAP, COLOR_KEYS, THEMES } from './theme';

function toUpperCamelCase(str: string): string {
  return str
    .replace(/^[a-z][a-z]?/g, (match) => match.toUpperCase())
    .replace(/-[a-z]/g, (match) => match[1].toUpperCase())
    .replace(/-/g, '');
}

function getNaiveUIComponents(): readonly string[] {
  const webTypesJSON = require('naive-ui/web-types.json') as {
    contributions: { html: { elements: { name: string }[] } };
  };
  return webTypesJSON.contributions.html.elements
    .map((tag) => toUpperCamelCase(tag.name))
    .filter((x) => x.startsWith('N'));
}

function NativeUIResolver() {
  const componentSet: ReadonlySet<string> = new Set(getNaiveUIComponents());
  return {
    type: 'component',
    resolve: (name: string) =>
      componentSet.has(name)
        ? {
            name,
            from: 'naive-ui',
          }
        : undefined,
  } as const;
}

function CustomResolver(
  type: 'component' | 'directive',
  components: Record<string, ComponentResolveResult>
): ComponentResolver {
  return {
    type,
    resolve: (name: string) => components[name],
  };
}

function themePlugin() {
  const virtualModuleId = 'virtual:theme.css';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  const content = Object.values(THEMES)
    .map(
      (theme) =>
        `*[data-s-theme='${theme.name}'] {\n` +
        COLOR_KEYS.map(
          (key) => `${COLOR_CSS_VAR_MAP[key]}: ${theme[key]};\n`
        ).join('') +
        '}\n'
    )
    .join('');

  return {
    name: 'theme-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return content;
      }
    },
  };
}

async function createMangleReplacements(): Promise<[string, string][]> {
  const indexToIdentifier = (index: number): string => {
    const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const ALNUM =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let id = '';
    while (index >= ALPHABET.length) {
      id = ALNUM[index % ALNUM.length] + id;
      index = Math.floor(index / ALNUM.length);
    }
    id = ALPHABET[index] + id;

    return id;
  };

  const GLOB_DIR = '..';
  const GLOB_PATTERN = [
    '**/*.{json,js,jsx,ts,tsx,vue}',
    '!**/.vite-ssg-dist/**',
    '!**/.vite-ssg-temp/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/node_modules/**',
  ];

  const IDENTIFIER_RE = /[a-zA-Z_$][\w$]*/g;
  const MANGLE_RE = /\$\$q$/;

  const files = await fg(GLOB_PATTERN, {
    cwd: GLOB_DIR,
    absolute: true,
  });

  const identifierMap = new Map<string, number>();
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const identifiers = content.match(IDENTIFIER_RE) || [];
    for (const identifier of identifiers) {
      identifierMap.set(identifier, (identifierMap.get(identifier) || 0) + 1);
    }

    // console.log('reading', file, ', identifierMap.size:', identifierMap.size);
  }

  const mangleNames = Array.from(identifierMap.entries())
    .filter(([identifier]) => MANGLE_RE.test(identifier))
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([identifier]) => identifier);

  let index = 0;
  const replacements = new Map<string, string>();
  for (const mangleName of mangleNames) {
    if (replacements.has(mangleName)) {
      continue;
    }

    let mangledId;
    do {
      mangledId = indexToIdentifier(index++);
    } while (identifierMap.has(mangledId));

    replacements.set(mangleName, mangledId);
  }

  return [...replacements].sort(([a], [b]) => b.length - a.length);
}

export default defineConfig(async ({ mode }) => {
  const IS_DEV = mode === 'development';

  let proxy: Record<string, ProxyOptions> = {};
  let staging = false;

  if (IS_DEV) {
    config({ path: '../shared-server/env/development.env' });

    // apply VITE_ env vars
    process.env.VITE_BUILD_REV = 'development';
    process.env.VITE_CDN_PORT =
      process.env.CDN_ORIGIN?.match(/:\d+$/)?.[0] || '';
    process.env.VITE_CDN_ORIGIN = '';
    process.env.VITE_HCAPTCHA_SITE_KEY_FOR_REGISTRATION =
      process.env.HCAPTCHA_SITE_KEY_FOR_REGISTRATION;

    // configure proxy
    const {
      API_BASE_PATH,
      API_ORIGIN_FOR_API_PROXY,
      SECRET_API_PROXY_AUTH_TOKEN,
    } = process.env;

    proxy = {
      '/api': {
        target: API_ORIGIN_FOR_API_PROXY,
        changeOrigin: true,
        headers: {
          'Streamist-Forwarded-CF-Connecting-IP': '127.0.0.1',
          'Streamist-Proxy-Authorization': `Bearer ${SECRET_API_PROXY_AUTH_TOKEN}`,
        },
        rewrite: (p: string) => p.replace(/^\/api\//, `${API_BASE_PATH}/`),
      },
      '/ws': {
        target: 'http://localhost:8788',
        changeOrigin: false,
        ws: true,
      },
    };
  } else {
    process.env.VITE_BUILD_REV = process.env.TARGET_BUILD_REV || 'unknown';
    staging = process.env.TARGET_NODE_ENV === 'staging';
  }

  const mangleReplacements = IS_DEV ? [] : await createMangleReplacements();

  // console.log(mangleReplacements);

  if (!IS_DEV) {
    const maxIdLength = mangleReplacements.reduce(
      (acc, cur) => Math.max(acc, cur[0].length),
      0
    );
    const content = [...mangleReplacements]
      .sort(([, a], [, b]) => (a < b ? -1 : 1))
      .map(([from, to]) => `${from.padEnd(maxIdLength)}  ${to}\n`)
      .join('');
    await writeFile('mangleReplacements.txt', content);

    console.log(content);
  }

  return {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[hash][extname]',
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
        },
      },
    },
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
        '$shared/': `${path.resolve(__dirname, '../shared/src')}/`,
      },
    },
    plugins: [
      replace({
        preventAssignment: false,
        delimiters: ['', ''],
        values: Object.fromEntries(mangleReplacements),
      }),

      createHtmlPlugin({
        inject: {
          data: {
            BUILD_REV: process.env.VITE_BUILD_REV,
          },
        },
        minify: {
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: false,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
        },
      }),

      Vue({
        include: [/\.vue$/, /\.md$/],
      }),

      VueJSX(),

      // https://github.com/hannoeru/vite-plugin-pages
      Pages({
        extensions: ['vue', 'md'],
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'vue-i18n',
          '@vueuse/core',
          '@vueuse/head',
        ],
        dts: 'src/auto-imports.d.ts',
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        extensions: ['vue'],

        include: [/\.vue$/, /\.vue\?vue/],

        // custom resolvers
        resolvers: [
          // auto import icons
          // https://github.com/antfu/unplugin-icons
          IconsResolver({
            // enabledCollections: ['carbon']
          }),
          NativeUIResolver(),
          CustomResolver('component', {
            VueDraggable: {
              from: 'vuedraggable',
            },
          }),
        ],

        dts: 'src/components.d.ts',
      }),

      // https://github.com/antfu/unplugin-icons
      Icons({
        autoInstall: true,
      }),

      // https://github.com/antfu/vite-plugin-windicss
      WindiCSS(),

      // https://github.com/antfu/vite-plugin-pwa
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'apple-touch-icon.png',
          'browserconfig.xml',
          'favicon.ico',
          'favicon.svg',
          'mstile-144x144.png',
          'mstile-150x150.png',
          'mstile-310x150.png',
          'mstile-310x310.png',
          'mstile-70x70.png',
          'ogp.png',
          'robots.txt',
          'safari-pinned-tab.svg',
        ],
        manifest: {
          id: '/',
          name: staging ? 'Streamist Staging' : 'Streamist',
          short_name: staging ? 'Streamist Staging' : 'Streamist',
          start_url: '/pwa',
          display: 'standalone',
          background_color: '#2a8dfe',
          theme_color: '#2a8dfe',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-maskable-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // this is needed to cache fonts (default: ['**\/*.{js,css,html}'])
          // see https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-GlobPartial
          globPatterns: ['**/*.{js,css,html}', 'assets/*'],
          navigateFallbackDenylist: [
            /^\/cdn-cgi\//,
            /^\/api\//,
            /^\/ws\//,
            /^\/auth([/#?]|$)/,
          ],
        },
      }),

      // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true,
        include: [path.resolve(__dirname, 'locales/**')],
      }),

      // https://github.com/antfu/vite-plugin-inspect
      Inspect({
        // change this to enable inspect for debugging
        enabled: false,
      }),

      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
      Vuetify({
        autoImport: true,
      }),

      themePlugin(),
    ],

    ...(mode === 'development'
      ? {
          server: {
            host: '0.0.0.0',
            fs: {
              strict: true,
            },
            proxy,
          },
          preview: {
            proxy,
          },
        }
      : {}),

    // https://github.com/antfu/vite-ssg
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
    },

    optimizeDeps: {
      include: [
        'axios',
        '@aspida/axios',
        'dexie',
        'fuse.js',
        'humanize-duration',
        'naive-ui',
        'p-queue',
        'ua-parser-js',
        'vue',
        'vuedraggable',
        'vue-router',
        '@vueuse/core',
        '@vueuse/head',
      ],
      exclude: ['vue-demi', 'vuetify'],
    },
  };
});
