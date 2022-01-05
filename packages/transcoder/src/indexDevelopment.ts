import './checkEnv';
import './initCredentials';

import { createServer } from 'node:http';
import fetch from 'node-fetch';
import { nodeReadableStreamToBuffer } from '$shared-server/stream';
import { TRANSCODER_API_PATH, TRANSCODER_PORT } from './devConfig';
import logger from './logger';
import { transcode } from './transcode';
import type { TranscoderRequest } from './types/transcoder';

const server = createServer();

server.on('request', (req, res) => {
  (async () => {
    if (req.method === 'POST' && req.url === TRANSCODER_API_PATH) {
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

          return fetch(transcoderRequest.callbackURL, {
            method: 'POST',
            headers: {
              Authorization: transcoderRequest.callbackToken,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(transcoderResponse),
          });
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

server.listen(TRANSCODER_PORT);
