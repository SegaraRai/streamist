const canPlayTypeCacheMap = new Map<string, CanPlayTypeResult>();

export function canPlayAudioType(type: string): CanPlayTypeResult {
  let result = canPlayTypeCacheMap.get(type);

  if (result == null) {
    result = new Audio().canPlayType(type);
    canPlayTypeCacheMap.set(type, result);
  }

  return result;
}
