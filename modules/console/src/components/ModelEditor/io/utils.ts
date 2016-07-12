export function arrayBufferToString(buffer: ArrayBuffer, byteOffset, length) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer, byteOffset, length));
}
