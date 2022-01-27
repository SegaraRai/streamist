import lazySizes from 'lazysizes';
import type { App } from 'vue';

import {
  isCDNCookieSet,
  needsCDNCookie,
  setCDNCookie,
} from './logic/cdnCookie';

export function installLazySizes(app: App) {
  app.directive('lazysizes', {
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

    if (!el.dataset.src || !needsCDNCookie(el.dataset.src)) {
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
}
