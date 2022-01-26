import { config } from 'dotenv';
import minimist from 'minimist';
import {
  useConfigDevelopment,
  useConfigStaging,
} from '$shared-server/objectStorage';
import { initS3 } from './initS3';
import { initTranscoder } from './initTranscoder';
import { setResultEnvDir } from './write';

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2));

  const { TARGET_NODE_ENV = argv._[1] } = process.env;
  switch (TARGET_NODE_ENV) {
    case 'development':
      useConfigDevelopment();
      break;

    case 'staging':
      useConfigStaging();
      break;

    default:
      throw new Error(`Unknown TARGET_NODE_ENV: ${TARGET_NODE_ENV}`);
  }

  console.log('TARGET_NODE_ENV:', TARGET_NODE_ENV);

  setResultEnvDir(TARGET_NODE_ENV);

  config({
    path: `../shared-server/env/${TARGET_NODE_ENV}.env`,
  });

  switch (argv._[0]) {
    case 'initS3':
      await initS3(TARGET_NODE_ENV);
      break;

    case 'initTranscoder':
      await initTranscoder(TARGET_NODE_ENV);
      break;

    case 'initAll':
      await initS3(TARGET_NODE_ENV);
      await initTranscoder(TARGET_NODE_ENV);
      break;

    default:
      throw new Error(`Unknown command: ${argv._[0]}`);
  }
}

main().catch((error): void => {
  console.error(error);
  process.exit(1);
});
