import './initOS';

// register vue composition api globally
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { ViteSSG } from 'vite-ssg';
import App from '~/App.vue';
import {
  RESTORE_SCROLL_CHECK_INTERVAL,
  RESTORE_SCROLL_CHECK_TIMEOUT,
  STORE_SCROLL_THROTTLE,
} from '~/config';
import { installLazySizes } from '~/lazyloading';
import { activateTokenInterceptor } from '~/logic/api';
import { parseRedirectTo } from '~/logic/parseRedirectTo';
import { isAuthenticated } from '~/logic/tokens';
import { currentScrollContainerRef, currentScrollRef } from '~/stores/scroll';

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

const routes = setupLayouts(generatedRoutes);

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(App, { routes }, (ctx) => {
  // install all modules under `modules/`
  for (const mod of Object.values(import.meta.globEager('./modules/*.ts'))) {
    mod.install?.(ctx);
  }

  if (ctx.isClient) {
    // redirect /playing to /
    ctx.router.beforeEach((to, _from, next) => {
      if (to.path === '/playing') {
        return next('/');
      }
      next();
    });

    ctx.router.beforeEach(async (to, _from, next) => {
      const authenticated = await isAuthenticated();
      const isAppPage = !!to.meta.requiresAuth;
      const isAuthPage = !!to.meta.authPage;
      if ((authenticated && isAuthPage) || (!authenticated && isAppPage)) {
        return next(
          authenticated
            ? parseRedirectTo(to.path === '/login' ? to.query.to : '/')
            : `/login?to=${encodeURIComponent(to.path)}`
        );
      }
      next();
    });

    // we cannot use beforeEach as it shows navigated (backed) history.state on history back
    // there seems to be no way (except handling it explicitly on popstate) to deal with it
    watchThrottled(
      [currentScrollRef, currentScrollContainerRef],
      ([scrollPosition, element]): void => {
        history.replaceState(
          {
            ...history.state,
            appScroll: element ? scrollPosition : null,
          },
          ''
        );
      },
      {
        throttle: STORE_SCROLL_THROTTLE,
      }
    );

    window.addEventListener('popstate', (): void => {
      const state = history.state;
      const scrollPosition = state?.appScroll as number | null | undefined;
      if (scrollPosition != null) {
        const finish = Date.now() + RESTORE_SCROLL_CHECK_TIMEOUT;
        const interval = RESTORE_SCROLL_CHECK_INTERVAL;
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
