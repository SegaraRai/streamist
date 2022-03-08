// encoded by LAME 3.100
// actually url encoding is shorter than base64 encoding
const strFrameBase64 =
  '//sUxNoDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

const FRAME_PER_SECOND = 48000 / 1152;

export function createSilentMP3DataURI(duration: number): string {
  const numFrames = Math.round(duration * FRAME_PER_SECOND);
  return `data:audio/mp3;base64,${strFrameBase64.repeat(numFrames)}`;
}
