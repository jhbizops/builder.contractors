import { describe, expect, it } from "vitest";
import {
  assertAdminBootstrapStartupConfig,
  getAdminBootstrapSecurityConfig,
  isBootstrapIpAllowed,
  verifyBootstrapToken,
} from "../adminBootstrap";

describe("admin bootstrap config", () => {
  it("defaults to disabled", () => {
    const config = getAdminBootstrapSecurityConfig({ NODE_ENV: "production" });
    expect(config.enabled).toBe(false);
    expect(config.token).toBeNull();
    expect(config.allowedIps).toEqual([]);
  });

  it("rejects production bootstrap without token and allowlist", () => {
    expect(() =>
      assertAdminBootstrapStartupConfig({
        NODE_ENV: "production",
        ALLOW_ADMIN_BOOTSTRAP: "true",
      }),
    ).toThrow("ADMIN_BOOTSTRAP_TOKEN");
  });

  it("accepts production bootstrap when all safeguards are configured", () => {
    expect(() =>
      assertAdminBootstrapStartupConfig({
        NODE_ENV: "production",
        ALLOW_ADMIN_BOOTSTRAP: "true",
        ADMIN_BOOTSTRAP_TOKEN: "one-time-token",
        ADMIN_BOOTSTRAP_ALLOWED_IPS: "127.0.0.1,10.0.0.1",
      }),
    ).not.toThrow();
  });

  it("enforces exact token and ip matching", () => {
    expect(verifyBootstrapToken("token", "token")).toBe(true);
    expect(verifyBootstrapToken("token", "token-2")).toBe(false);
    expect(isBootstrapIpAllowed("127.0.0.1", ["127.0.0.1"]))
      .toBe(true);
    expect(isBootstrapIpAllowed("127.0.0.2", ["127.0.0.1"]))
      .toBe(false);
  });
});
