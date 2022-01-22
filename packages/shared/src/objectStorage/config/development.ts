import { setOSRegions } from '../set';

export const regionsDevelopment = ['ap-northeast-1'] as const;

export function useRegionsDevelopment(): void {
  setOSRegions(regionsDevelopment);
}
