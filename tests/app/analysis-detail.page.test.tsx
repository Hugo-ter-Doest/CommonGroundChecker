/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getRepoHistory = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ getRepoHistory }));

import AnalysisDetailPage from "@/app/history/[owner]/[repo]/[analysisId]/page";

function result(id: string, status: string, starRating?: number) {
  return { id, title: id, description: `${id} check`, status, message: `${id} ${status}`, evidence: [], starRating };
}

describe("AnalysisDetailPage", () => {
  afterEach(() => cleanup());

  it("shows the overall stars and each criterion's stars", async () => {
    getRepoHistory.mockResolvedValue({
      repository: { metadata: { repoUrl: "https://github.com/org/repo", topics: [] } },
      analyses: [
        {
          id: "analysis-1",
          checkedAt: "2026-11-11T15:39:33Z",
          score: 71,
          version: "1.0.0",
          results: [result("maintainability", "warn", 2), result("license", "pass")],
        },
      ],
    });

    render(await AnalysisDetailPage({ params: Promise.resolve({ owner: "org", repo: "repo", analysisId: "analysis-1" }) }));

    expect(screen.getByLabelText("4 of 5 stars")).toBeTruthy();
    expect(screen.getByLabelText("2 of 5 stars")).toBeTruthy();
    expect(screen.getByLabelText("5 of 5 stars")).toBeTruthy();
  });
});
