export type Region = 'ap-northeast-1';

export function isValidRegion(region: unknown): region is Region {
  if (typeof region !== 'string') {
    return false;
  }

  switch (region) {
    case 'ap-northeast-1':
      return true;
  }

  return false;
}

export function toRegion(region: unknown): Region {
  if (isValidRegion(region)) {
    return region;
  }

  throw new TypeError(`unknown region: ${region}`);
}
