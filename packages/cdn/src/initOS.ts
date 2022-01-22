import { configDevelopment, setOS } from '$shared/objectStorage';

switch (BUILD_TIME_DEFINITION.NODE_ENV) {
  case 'development':
    setOS(configDevelopment);
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
