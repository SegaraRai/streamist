import { z } from 'zod';

export const zRepeatType = z.union([
  z.literal('off'),
  z.literal('all'),
  z.literal('one'),
]);

export type RepeatType = z.infer<typeof zRepeatType>;
