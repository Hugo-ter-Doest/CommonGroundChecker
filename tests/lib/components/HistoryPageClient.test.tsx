/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import HistoryPageClient from "@/components/HistoryPageClient";
import type { RepoSummary } from "@/generated/openapi-client";

function summary(overrides: Partial<RepoSummary>): RepoSummary {
  return {
    id: "repo-1",
    owner: "open-zaak",
    name: "open-zaak",
    repoUrl: "https://github.com/open-zaak/open-zaak",
    helmChartLocations: [],
    dockerLocations: [],
    apiSpecificationLocations: [],
    documentationLocations: [],
    version: null,
    updatedAt: "2026-05-06T00:00:00Z",
    analysisCount: 1,
    latestAnalysis: { checkedAt: "2026-05-06T00:00:00Z", score: 80, version: null },
    ...overrides,
  };
}

function renderCards(repositories: RepoSummary[]) {
  render(<HistoryPageClient sort="date" direction="desc" repositories={repositories} />);
}

afterEach(() => {
  cleanup();
});

describe("HistoryPageClient version chip", () => {
  it("shows the latest analysis's version before the repository's", () => {
    renderCards([
      summary({
        version: "v1.30.0",
        latestAnalysis: { checkedAt: "2026-05-06T00:00:00Z", score: 80, version: "v1.31.2" },
      }),
    ]);

    expect(screen.getByText("Version: v1.31.2")).toBeTruthy();
    expect(screen.queryByText("Version: v1.30.0")).toBeNull();
  });

  it("falls back to the repository's version", () => {
    renderCards([summary({ version: "v2.1.0" })]);

    expect(screen.getByText("Version: v2.1.0")).toBeTruthy();
  });

  it("shows no version chip when neither version is known", () => {
    renderCards([summary({})]);

    expect(screen.getByText("Latest score: 80")).toBeTruthy();
    expect(screen.queryByText(/Version:/)).toBeNull();
  });
});
