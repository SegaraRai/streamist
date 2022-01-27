import './initOS';
import './initCredentials';

import type { Context } from 'aws-lambda';
import { sendCallback } from './callback';
import logger from './logger';
import { transcode } from './transcode';
import type { TranscoderRequest } from './types';

export async function handler(
  transcoderRequest: TranscoderRequest,
  _context: Context
): Promise<void> {
  logger.info(transcoderRequest);

  const transcoderResponse = await transcode(transcoderRequest);
  logger.info(transcoderResponse);

  await sendCallback(transcoderRequest, transcoderResponse);
}
