import './checkEnv';
import './initOS';
import './initCredentials';

import { createServer } from 'http';
import { nodeReadableStreamToBuffer } from '$shared-server/stream';
import { sendCallback } from './callback';
import logger from './logger';
import { transcode } from './transcode';
import type { TranscoderRequest } from './types';

const server = createServer();

server.on('request', (req, res) => {
  (async () => {
    if (req.method === 'POST' && req.url === '/api/transcode') {
      if (!/^application\/json;?/.test(req.headers['content-type'] || '')) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('content-type must be application/json');
        return;
      }

      const transcoderRequest = JSON.parse(
        (await nodeReadableStreamToBuffer(req)).toString('utf-8')
      ) as TranscoderRequest;
      logger.info(transcoderRequest);

      transcode(transcoderRequest)
        .then((transcoderResponse) => {
          logger.info(transcoderResponse);
          return sendCallback(transcoderRequest, transcoderResponse);
        })
        .catch((error) => {
          logger.error(error);
        });

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

server.listen(process.env.PORT || 8080);
