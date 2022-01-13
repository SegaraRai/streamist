export const PLANS = ['free', 'unlimited'] as const;
export type Plan = typeof PLANS[number];

export const MAX_SOURCE_FILE_RETENTION_PER_PLAN: Record<Plan, number | false> =
  {
    free: 30 * 24 * 60 * 60 * 1000,
    unlimited: false,
  };

export const MAX_TRACKS_PER_PLAN: Record<Plan, number | false> = {
  free: 1000,
  unlimited: false,
};

export const MAX_SOURCE_AUDIO_FILE_SIZE_PER_PLAN: Record<Plan, number | false> =
  {
    free: 300 * 1024 * 1024,
    unlimited: 800 * 1024 * 1024,
  };

export const MAX_SOURCE_CUE_SHEET_FILE_SIZE_PER_PLAN: Record<
  Plan,
  number | false
> = {
  free: 1 * 1024 * 1024,
  unlimited: 1 * 1024 * 1024,
};

export const MAX_SOURCE_IMAGE_FILE_SIZE_PER_PLAN: Record<Plan, number | false> =
  {
    free: 100 * 1024 * 1024, // 100MiB
    unlimited: 100 * 1024 * 1024, // 100MiB
  };
