import {
  useConfigDevelopment,
  useConfigStaging,
} from '$shared-server/objectStorage';

switch (BUILD_TIME_DEFINITION.NODE_ENV) {
  case 'development':
  case 'test':
    useConfigDevelopment();
    break;

  case 'staging':
    useConfigStaging();
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
