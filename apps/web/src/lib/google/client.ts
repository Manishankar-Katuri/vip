export async function googleFetch<T>(url: string): Promise<T> {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Google Business Profile access token is not configured.");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Google Business Profile API returned HTTP ${response.status}; refresh OAuth authorization.`);
  }
  return response.json() as Promise<T>;
}
