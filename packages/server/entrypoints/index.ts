import { init } from '$/services/app';
import { API_SERVER_PORT } from '$/services/env';

init()
  .listen(API_SERVER_PORT, '0.0.0.0')
  .then(() => {
    // PM2 graceful start
    // See also https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
    console.log('initialized');
    process.send?.('ready');
  });
