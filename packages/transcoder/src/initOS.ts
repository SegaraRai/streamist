import { useConfigDevelopment } from '$shared-server/objectStorage';

switch (process.env.NODE_ENV) {
  case 'development':
  case 'test':
    useConfigDevelopment();
    break;

  default:
    throw new Error('unknown NODE_ENV');
}
