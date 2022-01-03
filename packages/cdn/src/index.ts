/* ! @streamist/cdn-cfw */

import './checkEnv';

import { handler } from './routes';

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handler(event));
});
