import type { getPrismaClient } from '@prisma/client/runtime';
import { client } from './client';

export function dbFormatDateTime(date = new Date()): string | number {
  const internalClient = client as unknown as InstanceType<
    ReturnType<typeof getPrismaClient>
  >;
  const provider = internalClient._engineConfig.activeProvider;
  switch (provider) {
    case 'sqlite':
      return date.getTime();
  }
  throw new Error(`unsupported provider: ${provider}`);
}
