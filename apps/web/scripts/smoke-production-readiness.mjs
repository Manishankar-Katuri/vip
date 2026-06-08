const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const routes = [
  "/api/system/readiness",
  "/overview",
  "/workflows",
  "/reports",
  "/clients",
  "/settings",
];

const results = [];
for (const route of routes) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const body = route === "/api/system/readiness" ? await response.json().catch(() => null) : null;
    const redirect = response.status >= 300 && response.status < 400;
    results.push({
      route,
      status: response.status,
      ok: response.ok || redirect || response.status === 503 && route === "/api/system/readiness",
      readiness: body?.status,
    });
  } catch (error) {
    results.push({
      route,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Request failed.",
    });
  }
}

for (const result of results) {
  const suffix = result.readiness ? ` readiness=${result.readiness}` : result.error ? ` error=${result.error}` : "";
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.route} status=${result.status}${suffix}`);
}

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
