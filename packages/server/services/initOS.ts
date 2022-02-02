import {
  useConfigDevelopment,
  useConfigProduction,
  useConfigStaging,
} from '$shared-server/objectStorage';

switch (process.env.NODE_ENV) {
  case 'development':
  case 'test':
    useConfigDevelopment();
    break;

  case 'production':
    useConfigProduction();
    break;

  case 'staging':
    useConfigStaging();
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
