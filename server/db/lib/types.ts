import type { PrismaClient } from '$prisma/client';

export type TransactionalPrismaClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
