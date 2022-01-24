import { writeFileSync } from 'fs';
import path from 'path';
import VueI18n from '@intlify/vite-plugin-vue-i18n';
import Vue from '@vitejs/plugin-vue';
import VueJSX from '@vitejs/plugin-vue-jsx';
import Vuetify from '@vuetify/vite-plugin';
import { config } from 'dotenv';
import LinkAttributes from 'markdown-it-link-attributes';
import Prism from 'markdown-it-prism';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import {
  ComponentResolveResult,
  ComponentResolver,
} from 'unplugin-vue-components/dist/types';
import Components from 'unplugin-vue-components/vite';
import { ProxyOptions, defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import Markdown from 'vite-plugin-md';
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

const markdownWrapperClasses = 'prose prose-sm m-auto text-left';

function createVuetifyDTS(): void {
  const importMapJSON = require('vuetify/dist/json/importMap.json') as {
    readonly components: Record<string, unknown>;
  };

  const importLines = Object.keys(importMapJSON.components)
    .map(
      (key) =>
        `\n    ${key}: typeof import('vuetify/lib/components/index')['${key}'];`
    )
    .sort()
    .join('');

  const content = `// generated by vuetify-dts

declare module 'vue' {
  export interface GlobalComponents {${importLines}
  }
}

export {};
`;
  writeFileSync('src/vuetify.d.ts', content);
}

function getNaiveUIComponents(): readonly string[] {
  const webTypesJSON = require('naive-ui/web-types.json') as {
    contributions: { html: { tags: { name: string }[] } };
  };
  return webTypesJSON.contributions.html.tags
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
            importName: name,
            path: 'naive-ui',
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

createVuetifyDTS();

export default defineConfig(({ mode }) => {
  let proxy: Record<string, ProxyOptions> = {};

  if (mode === 'development') {
    config({ path: '../shared-server/env/development.env' });

    // apply VITE_ env vars
    process.env.VITE_CDN_ORIGIN = process.env.CDN_ORIGIN;
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
    };
  }

  return {
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
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],

        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

        // custom resolvers
        resolvers: [
          // auto import icons
          // https://github.com/antfu/unplugin-icons
          IconsResolver({
            // enabledCollections: ['carbon']
          }),
          NativeUIResolver(),
          CustomResolver('component', {
            GDraggable: {
              path: 'vuedraggable',
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
      WindiCSS({
        safelist: markdownWrapperClasses,
      }),

      // https://github.com/antfu/vite-plugin-md
      // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
      Markdown({
        wrapperClasses: markdownWrapperClasses,
        headEnabled: true,
        markdownItSetup(md) {
          // https://prismjs.com/
          md.use(Prism);
          md.use(LinkAttributes, {
            pattern: /^https?:\/\//,
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          });
        },
      }),

      // https://github.com/antfu/vite-plugin-pwa
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'safari-pinned-tab.svg'],
        manifest: {
          name: 'Streamist',
          short_name: 'Streamist',
          theme_color: '#ffffff',
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
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
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
