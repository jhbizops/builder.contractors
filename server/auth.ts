import { pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(pbkdf2Callback);
const PBKDF2_ITERATIONS = 310_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export interface PasswordHash {
  hash: string;
  salt: string;
  iterations: number;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(16).toString("base64");
  const derivedKey = await pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);

  return {
    hash: derivedKey.toString("base64"),
    salt,
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const derivedKey = await pbkdf2(password, stored.salt, stored.iterations, KEY_LENGTH, DIGEST);
  const storedBuffer = Buffer.from(stored.hash, "base64");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}
