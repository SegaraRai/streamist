import './initOS';
import './initCredentials';

import { createServer } from 'http';
import {
  DEV_TRANSCODER_API_PATH,
  DEV_TRANSCODER_PORT,
} from '$shared-server/config';
import { nodeReadableStreamToBuffer } from '$shared-server/stream';
import { sendCallback } from './callback';
import logger from './logger';
import { transcode } from './transcode';
import type { TranscoderRequest } from './types';

const server = createServer();

server.on('request', (req, res): void => {
  (async (): Promise<void> => {
    if (req.method === 'POST' && req.url === DEV_TRANSCODER_API_PATH) {
      if (!/^application\/json;?/.test(req.headers['content-type'] || '')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Content-Type must be application/json');
        return;
      }

      const transcoderRequest = JSON.parse(
        (await nodeReadableStreamToBuffer(req)).toString('utf-8')
      ) as TranscoderRequest;
      logger.info(transcoderRequest);

      const transcoderResponse = await transcode(transcoderRequest);
      logger.info(transcoderResponse);

      await sendCallback(transcoderRequest, transcoderResponse);

      res.statusCode = 204;
      res.end();

      return;
    }

    // not found
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('endpoint not found');
  })().catch((err) => {
    logger.error(err);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(String(err));
  });
});

server.listen(DEV_TRANSCODER_PORT);
