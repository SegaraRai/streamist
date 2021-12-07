import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import type { UserModule } from '~/types';

export const install: UserModule = ({ isClient, app }) => {
  if (!isClient) {
    return;
  }

  app.use(createVuetify());
};
