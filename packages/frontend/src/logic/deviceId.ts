export function generateDeviceId(): string {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return [...array].map((item) => item.toString(16).padStart(8, '0')).join('');
}
