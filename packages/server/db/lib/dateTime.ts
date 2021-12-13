export function dbFormatDateTime(date = new Date()): string {
  return date.toISOString();
}
