import { setOSRegions } from '../set';

export const regionsStaging = ['ap-northeast-1'] as const;

export function useRegionsStaging(): void {
  setOSRegions(regionsStaging);
}
