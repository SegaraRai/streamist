import { configDevelopment, setOS } from '$shared/objectStorage';

switch (process.env.NODE_ENV) {
  case 'development':
    setOS(configDevelopment);
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
