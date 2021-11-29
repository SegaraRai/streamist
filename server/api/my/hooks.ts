import { defineHooks } from './albums/$relay';
import { onRequest } from '$/hooks/auth';

export default defineHooks(() => ({
  onRequest,
}));

export type { AdditionalRequest } from '$/hooks/auth';
