import {
  useConfigDevelopment,
  useConfigProduction,
  useConfigStaging,
} from '$shared-server/objectStorage';

switch (BUILD_TIME_DEFINITION.NODE_ENV) {
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
