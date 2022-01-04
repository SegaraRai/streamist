export function isId(id: unknown): boolean {
  return typeof id === 'string' && /^[\w-]+$/.test(id);
}
