import './checkEnv.js';
import './initCredentials.js';

import { createServer } from 'node:http';
import logger from './logger.js';
import { transcode } from './transcode.js';
import { nodeReadableStreamToBuffer } from '$shared-server/stream.js';

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

      const transcodeRequest = JSON.parse(
        (await nodeReadableStreamToBuffer(req)).toString('utf-8')
      );

      const transcodeResponse = await transcode(transcodeRequest);

      // NOTE: send request to transcodeRequest.callback on production

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(transcodeResponse, null, 2));

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

server.listen(8744);
