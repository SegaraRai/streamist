import { z } from 'zod';
import type { DeepReadonly } from './_internal/readonly';

export const zClientName = z.union([
  // web app
  z.literal('Streamist Web App'),
  // installed (standalone) web app
  z.literal('Streamist PWA'),
]);

export type ClientName = z.infer<typeof zClientName>;

export const zDeviceType = z.union([
  z.literal('desktop'),
  z.literal('mobile'),
  z.literal('unknown'),
]);

export type DeviceType = z.infer<typeof zDeviceType>;

export const zSessionInfo = z.object({
  client: zClientName,
  type: zDeviceType,
  platform: z.string().transform((v) => v.slice(0, 32)),
  name: z.string().transform((v) => v.slice(0, 32)),
});

export type SessionInfo = DeepReadonly<z.infer<typeof zSessionInfo>>;
