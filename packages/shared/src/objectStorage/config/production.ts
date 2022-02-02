import { setOSRegions } from '../set';

export const regionsProduction = ['ap-northeast-1'] as const;

export function useRegionsProduction(): void {
  setOSRegions(regionsProduction);
}
