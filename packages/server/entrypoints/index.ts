import cluster from 'cluster';
import { cpus } from 'os';
import minimist from 'minimist';
import { initBatch } from '$/batch';
import { init } from '$/services/app';
import { devMigrate } from '$/services/dev/migrate';
import { API_SERVER_PORT } from '$/services/env';
import { logger } from '$/services/logger';

function mainAPI(): void {
  if (cluster.isPrimary) {
    logger.info('primary: started');

    const numWorkers = Math.max(cpus().length - 2, 2);
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    logger.info('primary: launched workers');
  } else {
    const app = init();

    app.listen(API_SERVER_PORT, '0.0.0.0').then((): void => {
      app.log.info('started');

      // PM2 graceful start
      // See also https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
      process.send?.('ready');
    });
  }
}

function mainBatch(): void {
  logger.info('batch: started');
  initBatch();
  logger.info('batch: initialized');
}

function main(): void {
  const argv = minimist(process.argv.slice(2));
  const type = argv.type;

  switch (type) {
    case 'api':
      mainAPI();
      break;

    case 'batch':
      mainBatch();
      break;

    case 'migrate':
      devMigrate().then(() => {
        console.log('finished');
      });
      break;

    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }
}

main();
