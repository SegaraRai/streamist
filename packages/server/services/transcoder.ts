import { Lambda } from '@aws-sdk/client-lambda';
import { CloudTasksClient } from '@google-cloud/tasks';
import fetch from 'node-fetch';
import { DEV_TRANSCODER_API_ENDPOINT } from '$shared-server/config/dev';
import { OSRegion, getOSRegion } from '$shared-server/objectStorage';
import { TranscoderRequest } from '$transcoder/types';
import { logger } from '$/services/logger';

async function invokeTranscoderDev(request: TranscoderRequest): Promise<void> {
  try {
    const response = await fetch(DEV_TRANSCODER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      logger.error('failed to invoke transcoder (%d)', response.status);
    }
  } catch (error: unknown) {
    logger.error(error, 'failed to invoke transcoder');
  }
}

export async function invokeTranscoder(
  request: TranscoderRequest,
  region: OSRegion
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await invokeTranscoderDev(request);
  } else {
    const regionDef = getOSRegion(region);
    switch (request.runner) {
      case 'gcr': {
        // credentials will be provided by GOOGLE_APPLICATION_CREDENTIALS
        const client = new CloudTasksClient();
        const [response] = await client.createTask({
          parent: client.queuePath(
            regionDef.transcoderGCRProject,
            regionDef.transcoderGCRRegion,
            regionDef.transcoderGCRTasksQueueName
          ),
          task: {
            httpRequest: {
              httpMethod: 'POST',
              url: regionDef.transcoderGCRURL,
              body: Buffer.from(JSON.stringify(request)),
            },
          },
        });
        logger.info('invoked transcoder [GCR] (%s)', response.name);
        break;
      }

      case 'lambda': {
        const lambda = new Lambda({
          region: regionDef.transcoderLambdaRegion,
        });
        await lambda.invoke({
          InvocationType: 'Event',
          FunctionName: regionDef.transcoderLambdaName,
          Payload: Buffer.from(JSON.stringify(request)),
        });
        logger.info('invoked transcoder [Lambda]');
        break;
      }
    }
  }
}
