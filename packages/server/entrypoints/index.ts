import cluster from 'cluster';
import minimist from 'minimist';
import { initBatch } from '$/batch';
import { init } from '$/services/app';
import { API_SERVER_PORT } from '$/services/env';
import { logger } from '$/services/logger';

if (process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR) {
  (global as any).__bundlerPathsOverrides = {
    'pino-pipeline-worker': `${process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR}vendor-pino-pipeline-worker.js`,
    'pino-pretty': `${process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR}vendor-pino-pretty.js`,
    'pino-worker': `${process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR}vendor-pino-worker.js`,
    'pino/file': `${process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR}vendor-pino-file.js`,
    'thread-stream-worker': `${process.env.BUNDLE_SCRIPT_ABSOLUTE_DIR}vendor-thread-stream-worker.js`,
  };
}

function mainAPI(): void {
  if (cluster.isPrimary) {
    logger.info('primary: started');

    const numWorkers = 2;
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    logger.info('primary: launched %d workers', numWorkers);
  } else {
    const app = init();

    app.listen(API_SERVER_PORT, '0.0.0.0').then((): void => {
      app.log.info('started');
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

    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }
}

main();
