import { describe, expect, it } from "vitest";
import { buildJobShareUrl } from "../jobShare";

describe("buildJobShareUrl", () => {
  it("builds an absolute share URL when a base URL is provided", () => {
    const url = buildJobShareUrl("job_123", "https://elyment.example");
    expect(url).toBe("https://elyment.example/dashboard/jobs?jobId=job_123");
  });

  it("builds a relative share URL when the base URL is empty", () => {
    const url = buildJobShareUrl("job_456", "");
    const expected = new URL("/dashboard/jobs", window.location.origin);
    expected.searchParams.set("jobId", "job_456");
    expect(url).toBe(expected.toString());
  });
});
