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

    activateTokenInterceptor();
    installLazySizes(ctx.app);
  }
});
