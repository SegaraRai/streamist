import { CACHE_CONTROL_NO_STORE } from '$shared-server/cacheControl.js';
import { gzipAsync } from '$shared-server/gzip.js';
import { osPutData } from '$shared-server/objectStorage.js';
import {
  getTranscodeLogFileKey,
  getTranscodeLogFileOS,
} from '$shared-server/objectStorages.js';
import { ExecFileResult, execFileAsync } from './execFileAsync.js';
import logger from './logger.js';

async function uploadJSON(
  userId: string,
  sourceFileId: string,
  type: string,
  data: unknown
): Promise<void> {
  await osPutData(
    getTranscodeLogFileOS(),
    getTranscodeLogFileKey(userId, sourceFileId, type),
    await gzipAsync(Buffer.from(JSON.stringify(data, null, 2))),
    {
      cacheControl: CACHE_CONTROL_NO_STORE,
      contentType: 'application/json; charset=UTF-8',
      contentEncoding: 'gzip',
    }
  );
}

export async function execAndLog(
  file: string,
  args: string[],
  timeout: number,
  userId: string,
  sourceFileId: string,
  type: string,
  additionalLogRecord: Record<string, unknown> = {}
): Promise<ExecFileResult> {
  const beginTimestamp = Date.now();
  const result = await execFileAsync(file, args, timeout);
  const endTimestamp = Date.now();
  try {
    await uploadJSON(userId, sourceFileId, type, {
      userId,
      file,
      args,
      begin: beginTimestamp,
      end: endTimestamp,
      elapsed: endTimestamp - beginTimestamp,
      timeout,
      stderr: result.stderr$$q,
      stdout: result.stdout$$q,
      ...additionalLogRecord,
    });
  } catch (error: unknown) {
    logger.error(
      `failed to upload exec log as ${userId}/${sourceFileId}/${type}`,
      error
    );
  }
  return result;
}
