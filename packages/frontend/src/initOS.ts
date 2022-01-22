import { configDevelopment, setOS } from '$shared/objectStorage';

switch (import.meta.env.MODE) {
  case 'development':
    setOS(configDevelopment);
    break;

  default:
    throw new Error('unknown MODE');
}
