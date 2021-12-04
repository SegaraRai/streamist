import { processAudioRequest } from './transcoder/audio.js';
import { processImageRequest } from './transcoder/image.js';
import type {
  TranscoderRequest,
  TranscoderRequestInternal,
  TranscoderResponse,
  TranscoderResponseArtifact,
} from './types/transcoder.js';

export async function transcode(
  request: TranscoderRequest
): Promise<TranscoderResponse> {
  const artifacts: TranscoderResponseArtifact[] = [];

  const requests: TranscoderRequestInternal[] = [request];

  while (requests.length > 0) {
    const currentRequest = requests.shift()!;
    switch (currentRequest.type) {
      case 'audio': {
        const [artifact, imageRequests] = await processAudioRequest(
          currentRequest
        );
        requests.push(...imageRequests);
        artifacts.push(artifact);
        break;
      }

      case 'image': {
        const artifact = await processImageRequest(currentRequest);
        artifacts.push(artifact);
        break;
      }
    }
  }

  return {
    request,
    artifacts,
  };
}
