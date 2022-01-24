import {
  OSRegion,
  getTranscodeLogFileKey,
  getTranscodeLogFileOS,
} from '$shared-server/objectStorage';
import { osPutData } from '$shared-server/osOperations';
import { brotliCompressAsync } from '$shared-server/zlib';
import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { ExecFileResult, execFileAsync } from './execFileAsync';
import logger from './logger';

export interface UploadJSONStorage {
  userId: string;
  sourceId: string;
  sourceFileId: string;
  region: OSRegion;
}

export async function uploadJSON(
  type: string,
  { userId, sourceId, sourceFileId, region }: UploadJSONStorage,
  data: unknown
): Promise<void> {
  try {
    await osPutData(
      getTranscodeLogFileOS(region),
      getTranscodeLogFileKey(userId, sourceId, sourceFileId, type),
      await brotliCompressAsync(Buffer.from(JSON.stringify(data, null, 2))),
      {
        cacheControl: CACHE_CONTROL_NO_STORE,
        contentType: 'application/json; charset=UTF-8',
        contentEncoding: 'br',
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
  type: string,
  storage: UploadJSONStorage,
  additionalLogRecord: Record<string, unknown> = {}
): Promise<ExecFileResult> {
  const beginTimestamp = Date.now();
  const result = await execFileAsync(file, args, timeout);
  const endTimestamp = Date.now();
  await uploadJSON(type, storage, {
    userId: storage.userId,
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
