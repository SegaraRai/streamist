import { SW_UPDATE_CHECK_INTERVAL } from '~/config';
import { UserModule } from '~/types';

// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = ({ isClient, router }) => {
  if (!isClient) {
    return;
  }

  router.isReady().then(async (): Promise<void> => {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({
      immediate: true,
      onRegistered(registration): void {
        if (registration) {
          setInterval((): void => {
            registration.update();
          }, SW_UPDATE_CHECK_INTERVAL);
        }
      },
    });
  });
};
