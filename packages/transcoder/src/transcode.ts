import logger from './logger';
import { processAudioRequest } from './transcoder/audio';
import { processImageRequest } from './transcoder/image';
import type {
  TranscoderRequest,
  TranscoderRequestFileInternal,
  TranscoderResponse,
  TranscoderResponseArtifact,
} from './types';

export async function transcode(
  request: TranscoderRequest
): Promise<TranscoderResponse> {
  const artifacts: TranscoderResponseArtifact[] = [];

  const files: TranscoderRequestFileInternal[] = [...request.files];

  while (true) {
    const file = files.shift();
    if (!file) {
      break;
    }

    let artifact: TranscoderResponseArtifact;
    let additionalFiles: TranscoderRequestFileInternal[] | undefined;

    try {
      switch (file.type) {
        case 'audio': {
          [artifact, additionalFiles] = await processAudioRequest(file);
          break;
        }

        case 'image': {
          artifact = await processImageRequest(file);
          break;
        }

        default:
          throw new Error('unknown file type');
      }
    } catch (error) {
      logger.error(error);
      artifact = {
        type: 'error',
        source: file,
        error: String(error),
      };
    }

    artifacts.push(artifact);
    if (additionalFiles) {
      files.push(...additionalFiles);
    }
  }

  return {
    transcoderRevision: process.env.BUILD_REV || 'unknown',
    request,
    artifacts,
  };
}
