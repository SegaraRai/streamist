import fetch from 'node-fetch';
import { DEV_TRANSCODER_API_ENDPOINT } from '$shared-server/config/dev';
import { TranscoderRequest } from '$transcoder/types';
import { logger } from '$/services/logger';

export async function invokeTranscoder(
  request: TranscoderRequest
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch(DEV_TRANSCODER_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        logger.error('failed to invoke transcoder (%d)', response.status);
      }
    } catch (error: unknown) {
      logger.error(error, 'failed to invoke transcoder');
    }
  } else {
    // TODO(prod): call AWS Lambda
  }
}
