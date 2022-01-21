export function normalizeTextForSingleLine(
  text: string | undefined
): string | undefined {
  return text?.trim().replace(/[\r\n\v\f\u0085\u2028\u2029]/g, '') || undefined;
}

export function normalizeTextForMultipleLines(
  text: string | undefined
): string | undefined {
  return (
    text
      ?.trim()
      .replace(/\r\n/g, '\n')
      .replace(/[\r\n\v\f\u0085\u2028\u2029]/g, '\n') || undefined
  );
}
