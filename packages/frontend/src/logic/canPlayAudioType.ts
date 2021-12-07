const dummyAudioForChecking = new Audio();
const canPlayTypeCacheMap = new Map<string, CanPlayTypeResult>();

export function canPlayAudioType(type: string): CanPlayTypeResult {
  let result = canPlayTypeCacheMap.get(type);

  if (result == null) {
    result = dummyAudioForChecking.canPlayType(type);
    canPlayTypeCacheMap.set(type, result);
  }

  return result;
}
