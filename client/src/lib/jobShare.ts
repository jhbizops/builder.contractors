export function buildJobShareUrl(jobId: string, baseUrl?: string): string {
  const trimmedBase = baseUrl?.trim();
  const encodedId = encodeURIComponent(jobId);

  if (trimmedBase) {
    const url = new URL("/dashboard/jobs", trimmedBase);
    url.searchParams.set("jobId", encodedId);
    return url.toString();
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const url = new URL("/dashboard/jobs", window.location.origin);
    url.searchParams.set("jobId", encodedId);
    return url.toString();
  }

  return `/dashboard/jobs?jobId=${encodedId}`;
}
