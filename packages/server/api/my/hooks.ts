import { onRequest } from '$/hooks/auth';
import { defineHooks } from './$relay';

export default defineHooks(() => ({
  onRequest,
}));

export type { AdditionalRequest } from '$/hooks/auth';
