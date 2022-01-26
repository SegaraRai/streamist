import fetch, { Response } from 'node-fetch';
import type { TranscoderRequest, TranscoderResponse } from './types';

export function sendCallback(
  transcoderRequest: TranscoderRequest,
  transcoderResponse: TranscoderResponse
): Promise<Response> {
  return fetch(
    `${process.env.API_ORIGIN_FOR_TRANSCODER}${transcoderRequest.callbackPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SECRET_TRANSCODER_CALLBACK_SECRET}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(transcoderResponse),
    }
  );
}
