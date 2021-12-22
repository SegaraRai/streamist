import lazySizes from 'lazysizes';

// register vue composition api globally
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';

import { activateTokenInterceptor } from './logic/api';

// windicss layers
import 'virtual:windi-base.css';
import 'virtual:windi-components.css';
// your custom styles here
import './styles/main.css';
// windicss utilities should be the last style import
import 'virtual:windi-utilities.css';
// windicss devtools support (dev only)
import 'virtual:windi-devtools';

import {
  isCDNCookieSet,
  needsCDNCookie,
  setCDNCookie,
} from './logic/cdnCookie';

const routes = setupLayouts(generatedRoutes);

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(App, { routes }, (ctx) => {
  // install all modules under `modules/`
  for (const mod of Object.values(import.meta.globEager('./modules/*.ts'))) {
    mod.install?.(ctx);
  }

  ctx.app.directive('lazysizes', {
    beforeMount(el) {
      if (el.tagName !== 'IMG') {
        return;
      }
      el.classList.add('lazyload');
    },
    beforeUpdate(el, _binding, vNode, prevVNode) {
      if (el.tagName !== 'IMG') {
        return;
      }

      if (
        vNode.props?.['data-src'] === prevVNode.props?.['data-src'] &&
        vNode.props?.['data-srcset'] === prevVNode.props?.['data-srcset']
      ) {
        return;
      }

      el.classList.remove('lazyloaded');
      lazySizes.loader?.unveil(el);
    },
  });

  document.addEventListener('lazybeforeunveil', (event) => {
    const el = event.target as HTMLImageElement;

    if (!needsCDNCookie(el.dataset.src!)) {
      return;
    }

    if (isCDNCookieSet()) {
      return;
    }

    event.preventDefault();

    el.classList.add('s-lazyloading');

    setCDNCookie().then((): void => {
      el.classList.remove('s-lazyloading');
      lazySizes.loader?.unveil(el);
    });
  });

  activateTokenInterceptor();
});
