export function normalizeText(text: string | undefined): string | undefined {
  return text?.trim().replace(/[\r\n\v\f\u0085\u2028\u2029]/g, '') || undefined;
}
