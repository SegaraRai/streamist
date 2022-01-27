import { client } from '$/db/lib/client';
import { logger } from '$/services/logger';
import { TaskScheduler } from '$/taskScheduler';
import { cleanupClosedAccounts } from './cleanupDeletedAccounts';
import { cleanupOverRetentionSourceFiles } from './cleanupOverRetentionSourceFiles';
import {
  cleanupStaleTranscodes,
  cleanupStaleUploads,
} from './cleanupStaleSourceFiles';

export function initBatch(): void {
  const taskScheduler = new TaskScheduler();

  taskScheduler.schedule('0 10 * * * *', async (): Promise<void> => {
    try {
      await cleanupStaleUploads();
    } catch (error) {
      logger.error(error, 'cleanupStaleUploads failed');
    }

    try {
      await cleanupStaleTranscodes();
    } catch (error) {
      logger.error(error, 'cleanupStaleTranscodes failed');
    }
  });

  taskScheduler.schedule('0 30 17 * * *', async (): Promise<void> => {
    try {
      await cleanupOverRetentionSourceFiles();
    } catch (error) {
      logger.error(error, 'cleanupOverRetentionSourceFiles failed');
    }

    try {
      await cleanupClosedAccounts();
    } catch (error) {
      logger.error(error, 'cleanupClosedAccounts failed');
    }
  });

  /*
  // for testing
  taskScheduler.schedule('* * * * * *', async (): Promise<void> => {
    console.log('dummy task running!');
    await sleep(3000);
  });
  //*/

  client.$on('beforeExit', async () => {
    await taskScheduler.unscheduleAll();
  });
}
