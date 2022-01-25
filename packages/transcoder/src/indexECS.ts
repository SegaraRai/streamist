import './checkEnv';
import './initOS';
import './initCredentials';

import { sendCallback } from './callback';
import logger from './logger';
import { transcode } from './transcode';
import type { TranscoderRequest } from './types';

async function main(): Promise<void> {
  if (!process.env.TRANSCODER_REQUEST) {
    throw new Error('TRANSCODER_REQUEST is not defined');
  }

  const transcoderRequest = JSON.parse(
    Buffer.from(process.env.TRANSCODER_REQUEST, 'base64url').toString('utf-8')
  ) as TranscoderRequest;
  logger.info(transcoderRequest);

  const transcoderResponse = await transcode(transcoderRequest);
  logger.info(transcoderResponse);

  await sendCallback(transcoderRequest, transcoderResponse);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
