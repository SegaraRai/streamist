import './checkEnv.js';
import './initCredentials.js';

import { nodeReadableStreamToBuffer } from '$shared-server/stream.js';
import { createServer } from 'node:http';
import logger from './logger.js';
import { transcode } from './transcode.js';

import { osGetFile, osPutFile } from '$shared-server/objectStorage.js';
import {
  getSourceFileKey,
  getSourceFileOS,
} from '$shared-server/objectStorages.js';

const server = createServer();

server.on('request', (req, res) => {
  (async () => {
    if (
      req.method === 'POST' &&
      (req.url === '/api/test/upload' || req.url === '/api/test/upload/sha256')
    ) {
      const hashAlgorithm = req.url.endsWith('/sha256') ? 'sha256' : undefined;

      const hash = await osPutFile(
        getSourceFileOS('ap-northeast-1'),
        getSourceFileKey('upload-test-user', 'upload-test-file'),
        'test.weba',
        {
          cacheControl: 'no-store',
          contentType: 'application/octet-stream',
        },
        hashAlgorithm
      );

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`uploaded ${hash?.toString('hex')}`);

      return;
    }

    if (
      req.method === 'POST' &&
      (req.url === '/api/test/download' ||
        req.url === '/api/test/download/sha256')
    ) {
      const hashAlgorithm = req.url.endsWith('/sha256') ? 'sha256' : undefined;

      const hash = await osGetFile(
        getSourceFileOS('ap-northeast-1'),
        getSourceFileKey('upload-test-user', 'upload-test-file'),
        'test_download.weba',
        hashAlgorithm
      );

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`downloaded ${hash?.toString('hex')}`);

      return;
    }

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
