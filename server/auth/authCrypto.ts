import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export function generateSalt(): string {
  return randomBytes(SALT_BYTES).toString("base64");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = await scrypt(password, salt);
  return hash.toString("base64");
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hashBuffer = await scrypt(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, "base64");

  if (expectedBuffer.byteLength !== hashBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(hashBuffer, expectedBuffer);
}
