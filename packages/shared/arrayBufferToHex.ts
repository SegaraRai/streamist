/**
 * converts `ArrayBuffer` to lowercase hex string
 * @param arrayBuffer `ArrayBuffer`
 * @returns hex string (lowercase)
 */
export function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase();
}
