import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { VUETIFY_THEMES } from '~/logic/theme';
import type { UserModule } from '~/types';

export const install: UserModule = ({ isClient, app }) => {
  if (!isClient) {
    return;
  }

  app.use(
    createVuetify({
      theme: {
        defaultTheme: 'dark',
        themes: VUETIFY_THEMES,
      },
      display: {
        thresholds: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1280,
          xl: 1920,
          xxl: 2560,
        },
      },
    })
  );
};
