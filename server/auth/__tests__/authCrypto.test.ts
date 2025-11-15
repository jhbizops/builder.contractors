import { describe, expect, it } from "vitest";
import { generateSalt, hashPassword, verifyPassword } from "../authCrypto";

describe("authCrypto", () => {
  it("generates distinct salts", () => {
    const saltA = generateSalt();
    const saltB = generateSalt();
    expect(saltA).not.toEqual(saltB);
  });

  it("produces verifiable password hashes", async () => {
    const salt = generateSalt();
    const password = "TestPassword123!";
    const hash = await hashPassword(password, salt);

    expect(hash).not.toEqual(password);
    await expect(verifyPassword(password, salt, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", salt, hash)).resolves.toBe(false);
  });
});
