import { configDevelopment, setOS } from '$shared/objectStorage';

declare const NODE_ENV: string;

if (NODE_ENV === 'development') {
  setOS(configDevelopment);
} else {
  throw new Error('unknown NODE_ENV');
}
