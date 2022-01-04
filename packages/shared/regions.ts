export type Region = 'ap-northeast-1';

export function isRegion(region: unknown): region is Region {
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
  if (isRegion(region)) {
    return region;
  }

  throw new TypeError(`unknown region: ${region}`);
}
