import { configDevelopment, setOS } from '$shared/objectStorage';

if (import.meta.env.DEV) {
  setOS(configDevelopment);
} else {
  throw new Error('unknown NODE_ENV');
}
