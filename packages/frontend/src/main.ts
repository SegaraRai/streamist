// register vue composition api globally
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';

import { installLazySizes } from './lazyloading';
import { activateTokenInterceptor } from './logic/api';

// windicss layers
import 'virtual:windi-base.css';
import 'virtual:windi-components.css';
// theme
import 'virtual:theme.css';
// your custom styles here
import './styles/main.css';
// windicss utilities should be the last style import
import 'virtual:windi-utilities.css';
// windicss devtools support (dev only)
import 'virtual:windi-devtools';
import { isAuthenticated } from './logic/tokens';
import { currentScrollContainerRef, currentScrollRef } from './stores/scroll';

const SCROLL_CHECK_TIMEOUT = 5000;
const SCROLL_CHECK_INTERVAL = 100;

const routes = setupLayouts(generatedRoutes);

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(App, { routes }, (ctx) => {
  // install all modules under `modules/`
  for (const mod of Object.values(import.meta.globEager('./modules/*.ts'))) {
    mod.install?.(ctx);
  }

  if (ctx.isClient) {
    ctx.router.beforeEach(async (to, _from, next) => {
      const authenticated = await isAuthenticated();
      const isLoginPage = to.path === '/login';
      if (authenticated === isLoginPage) {
        return next(
          authenticated ? '/' : `/login?to=${encodeURIComponent(to.path)}`
        );
      }
      next();
    });

    // we cannot use beforeEach as it shows navigated (backed) history.state on history back
    // there seems to be no way (except handling it explicitly on popstate) to deal with it
    watch(
      [currentScrollRef, currentScrollContainerRef],
      ([scrollPosition, element]): void => {
        history.replaceState(
          {
            ...history.state,
            appScroll: element ? scrollPosition : null,
          },
          ''
        );
      }
    );

    window.addEventListener('popstate', (): void => {
      const state = history.state;
      const scrollPosition = state?.appScroll as number | null | undefined;
      if (scrollPosition != null) {
        const finish = Date.now() + SCROLL_CHECK_TIMEOUT;
        const interval = SCROLL_CHECK_INTERVAL;
        const check = (): void => {
          if (history.state.current !== state.current) {
            return;
          }

          const element = currentScrollContainerRef.value;
          if (
            element &&
            scrollPosition <= element.scrollHeight - element.clientHeight
          ) {
            element.scrollTop = scrollPosition;
            return;
          }
          if (Date.now() <= finish) {
            setTimeout(check, interval);
          }
        };
        check();
      }
    });

    activateTokenInterceptor();
    installLazySizes(ctx.app);
  }
});
