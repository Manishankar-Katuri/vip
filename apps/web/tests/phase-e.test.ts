import assert from "node:assert/strict";
import test from "node:test";

import { defaultPdfFileName, normalizePdfExportRequest } from "../src/lib/phase-e/pdf";
import { buildDataProvenance, provenanceStatus } from "../src/lib/phase-e/provenance";
import { lexicalSimilarity } from "../src/lib/phase-e/similarity-utils";

test("provenanceStatus classifies live, cached, stale, and mock data", () => {
  assert.equal(provenanceStatus({ cacheAgeSeconds: 30, recordCount: 1, cacheTtlSeconds: 60, staleAfterSeconds: 600, mock: false }), "LIVE");
  assert.equal(provenanceStatus({ cacheAgeSeconds: 120, recordCount: 1, cacheTtlSeconds: 60, staleAfterSeconds: 600, mock: false }), "CACHED");
  assert.equal(provenanceStatus({ cacheAgeSeconds: 700, recordCount: 1, cacheTtlSeconds: 60, staleAfterSeconds: 600, mock: false }), "STALE");
  assert.equal(provenanceStatus({ cacheAgeSeconds: 10, recordCount: 0, cacheTtlSeconds: 60, staleAfterSeconds: 600, mock: false }), "MOCK");
});

test("buildDataProvenance never emits an unlabeled source state", () => {
  const provenance = buildDataProvenance({
    source: "instagram",
    sourceService: "test",
    fetchedAt: new Date().toISOString(),
    recordCount: 12,
    apiCalled: "/api/admin/instagram-analytics",
  });

  assert.equal(provenance.status, "LIVE");
  assert.equal(provenance.recordCount, 12);
  assert.ok(provenance.freshnessScore > 0);
});

test("recommendation similarity flags near duplicate language", () => {
  const score = lexicalSimilarity("Post more reels between 6 PM and 8 PM", "Post more reels between 6 PM and 8 PM for growth");
  assert.ok(score > 0.85);
});

test("PDF export requests receive defaults and stable filenames", () => {
  const request = normalizePdfExportRequest({ pageType: "analytics", title: "Instagram Analytics" });
  assert.equal(request.pageType, "analytics");
  assert.deepEqual(request.kpis, []);
  assert.match(defaultPdfFileName(request), /^analytics-instagram-analytics\.pdf$/);
});
