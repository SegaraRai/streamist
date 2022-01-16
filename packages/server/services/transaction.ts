import { retryTransactionImpl } from '$shared/retry';
import { client } from '$/db/lib/client';
import type { TransactionalPrismaClient } from '$/db/lib/types';

export const retryTransaction = <T>(
  func: (txClient: TransactionalPrismaClient) => Promise<T>
): Promise<T> => retryTransactionImpl(() => client.$transaction(func));
