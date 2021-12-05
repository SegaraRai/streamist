import { processAudioRequest } from './transcoder/audio.js';
import { processImageRequest } from './transcoder/image.js';
import type {
  TranscoderRequest,
  TranscoderRequestFileInternal,
  TranscoderResponse,
  TranscoderResponseArtifact,
} from './types/transcoder.js';

export async function transcode(
  request: TranscoderRequest
): Promise<TranscoderResponse> {
  try {
    const artifacts: TranscoderResponseArtifact[] = [];

    const files: TranscoderRequestFileInternal[] = [...request.files];

    while (files.length > 0) {
      const file = files.shift()!;
      switch (file.type) {
        case 'audio': {
          const [artifact, imageFiles] = await processAudioRequest(file);
          files.push(...imageFiles);
          artifacts.push(artifact);
          break;
        }

        case 'image': {
          const artifact = await processImageRequest(file);
          artifacts.push(artifact);
          break;
        }
      }
    }

    return {
      request,
      artifacts,
      error: null,
    };
  } catch (error) {
    return {
      request,
      artifacts: [],
      error: String(error),
    };
  }
}
