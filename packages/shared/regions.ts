export type Region = 'ap-northeast-1';

export function toRegion(region: string): Region {
  switch (region) {
    case 'ap-northeast-1':
      return region;
  }

  throw new Error(`unknown region: ${region}`);
}
