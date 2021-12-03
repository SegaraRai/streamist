import 'source-map-support/register';

import '$shared-server/checkEnv';

import { nodeReadableStreamToBuffer } from '$shared-server/stream';
import { createServer } from 'node:http';

import logger from './logger';
import { transcode } from './transcode';

const server = createServer();

server.on('request', (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/transcode') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('endpoint is POST /api/transcode');
    return;
  }

  if (!/^application\/json;?/.test(req.headers['content-type'] || '')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('content-type must be application/json');
    return;
  }

  (async () => {
    const transcodeRequest = JSON.parse(
      (await nodeReadableStreamToBuffer(req)).toString('utf-8')
    );
    return transcode(transcodeRequest);
  })()
    .then((transcodeResponse) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(transcodeResponse, null, 2));
    })
    .catch((err) => {
      logger.error(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(String(err));
    });
});

server.listen(8744);
