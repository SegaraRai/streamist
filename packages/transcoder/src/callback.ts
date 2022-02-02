import fetch from 'node-fetch';
import {
  API_ORIGIN_FOR_TRANSCODER,
  SECRET_API_CLIENT_REFERRER,
  SECRET_TRANSCODER_CALLBACK_SECRET,
} from './env';
import logger from './logger';
import type { TranscoderRequest, TranscoderResponse } from './types';

export async function sendCallback(
  transcoderRequest: TranscoderRequest,
  transcoderResponse: TranscoderResponse
): Promise<void> {
  const response = await fetch(
    `${API_ORIGIN_FOR_TRANSCODER}${transcoderRequest.callbackPath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Referer: SECRET_API_CLIENT_REFERRER,
        'Streamist-Transcoder-Authorization': `Bearer ${SECRET_TRANSCODER_CALLBACK_SECRET}`,
      },
      body: JSON.stringify(transcoderResponse),
    }
  );
  logger.info('sent callback (%d)', response.status);
}
