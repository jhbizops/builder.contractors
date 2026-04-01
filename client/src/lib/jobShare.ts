import { JOBS_CANONICAL_PATH } from "@/lib/routes";

export function buildJobShareUrl(jobId: string, baseUrl?: string): string {
  const trimmedBase = baseUrl?.trim();
  const encodedId = encodeURIComponent(jobId);

  if (trimmedBase) {
    const url = new URL(JOBS_CANONICAL_PATH, trimmedBase);
    url.searchParams.set("jobId", encodedId);
    return url.toString();
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const url = new URL(JOBS_CANONICAL_PATH, window.location.origin);
    url.searchParams.set("jobId", encodedId);
    return url.toString();
  }

  return `${JOBS_CANONICAL_PATH}?jobId=${encodedId}`;
}
