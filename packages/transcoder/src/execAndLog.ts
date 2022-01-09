import { gzipAsync } from '$shared-server/gzip';
import { osPutData } from '$shared-server/objectStorage';
import { CACHE_CONTROL_NO_STORE } from '$shared/cacheControl';
import {
  OSRegion,
  getTranscodeLogFileKey,
  getTranscodeLogFileOS,
} from '$shared/objectStorage';
import { ExecFileResult, execFileAsync } from './execFileAsync';
import logger from './logger';

export async function uploadJSON(
  userId: string,
  sourceFileId: string,
  region: OSRegion,
  type: string,
  data: unknown
): Promise<void> {
  try {
    await osPutData(
      getTranscodeLogFileOS(region),
      getTranscodeLogFileKey(userId, sourceFileId, type),
      await gzipAsync(Buffer.from(JSON.stringify(data, null, 2))),
      {
        cacheControl: CACHE_CONTROL_NO_STORE,
        contentType: 'application/json; charset=UTF-8',
        contentEncoding: 'gzip',
      }
    );
  } catch (error: unknown) {
    logger.error(
      `failed to upload exec log as ${userId}/${sourceFileId}/${type}`,
      error
    );
  }
}

export async function execAndLog(
  file: string,
  args: string[],
  timeout: number,
  userId: string,
  sourceFileId: string,
  region: OSRegion,
  type: string,
  additionalLogRecord: Record<string, unknown> = {}
): Promise<ExecFileResult> {
  const beginTimestamp = Date.now();
  const result = await execFileAsync(file, args, timeout);
  const endTimestamp = Date.now();
  await uploadJSON(userId, sourceFileId, region, type, {
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
  return result;
}
