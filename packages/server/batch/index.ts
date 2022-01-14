import { RecurrenceRule, scheduleJob } from 'node-schedule';
import { logger } from '$/services/logger';
import { cleanupClosedAccounts } from './cleanupDeletedAccounts';
import { cleanupOverRetentionSourceFiles } from './cleanupOverRetentionSourceFiles';
import {
  cleanupStaleTranscodes,
  cleanupStaleUploads,
} from './cleanupStaleUploads';

export function initBatch(): void {
  const rule = new RecurrenceRule();
  rule.tz = 'Asia/Tokyo';
  rule.second = 0;
  rule.minute = 10;
  rule.hour = 4;

  scheduleJob(rule, async (): Promise<void> => {
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
}
