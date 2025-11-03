const encoder = new TextEncoder();

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function generateSalt(length = 16): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Cryptographic functions are not available.');
  }

  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  return bufferToBase64(array.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Cryptographic functions are not available.');
  }

  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

export { bufferToBase64 };
