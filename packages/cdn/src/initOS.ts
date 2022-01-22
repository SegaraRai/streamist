import { useConfigDevelopment } from '$shared-server/objectStorage';

switch (BUILD_TIME_DEFINITION.NODE_ENV) {
  case 'development':
    useConfigDevelopment();
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
