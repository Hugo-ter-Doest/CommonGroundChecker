/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getRepoHistory = vi.hoisted(() => vi.fn());
const getAdminScoring = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ getRepoHistory, getAdminScoring }));

import AnalysisDetailPage from "@/app/history/[owner]/[repo]/[analysisId]/page";
import { resolveCategory } from "@/lib/aspects";

function result(id: string, status: string, starRating?: number) {
  return { id, title: id, description: `${id} check`, status, message: `${id} ${status}`, evidence: [], starRating };
}

const GOVERNANCE = resolveCategory("Governance") as string;
const MAINTAINABILITY = resolveCategory("Maintainability") as string;

describe("AnalysisDetailPage", () => {
  afterEach(() => cleanup());

  it("shows each criterion's stars", async () => {
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

    expect(screen.getByLabelText("2 of 5 stars")).toBeTruthy();
    expect(screen.getByLabelText("5 of 5 stars")).toBeTruthy();
  });

  it("shows the stored overall rating and the rating per category", async () => {
    getRepoHistory.mockResolvedValue({
      repository: { metadata: { repoUrl: "https://github.com/org/repo", topics: [] } },
      analyses: [
        {
          id: "analysis-1",
          checkedAt: "2026-11-11T15:39:33Z",
          score: 71,
          rating: 3.4,
          categoryRatings: { [GOVERNANCE]: 4.6, [MAINTAINABILITY]: 2.1 },
          aspectRatings: { licensing: { rating: 4.6 } },
          endorsement: { passed: true, reasons: [] },
          version: "1.0.0",
          results: [result("maintainability", "warn", 2), result("license", "pass")],
        },
      ],
    });

    render(await AnalysisDetailPage({ params: Promise.resolve({ owner: "org", repo: "repo", analysisId: "analysis-1" }) }));

    expect(screen.getByRole("img", { name: "Overall rating 3.4 of 5.5, 3 stars" })).toBeTruthy();
    expect(screen.getByRole("img", { name: `${GOVERNANCE} rating 4.6 of 5.5, 5 stars` })).toBeTruthy();
    expect(screen.getByRole("img", { name: `${MAINTAINABILITY} rating 2.1 of 5.5, 2 stars` })).toBeTruthy();
    expect(screen.getByText("Compliance score 71")).toBeTruthy();
    expect(screen.getByText("Passes")).toBeTruthy();
    expect(getAdminScoring).not.toHaveBeenCalled();
  });

  it("rates an older analysis from its stored results", async () => {
    getAdminScoring.mockRejectedValue(new Error("offline"));
    getRepoHistory.mockResolvedValue({
      repository: { metadata: { repoUrl: "https://github.com/org/repo", topics: [] } },
      analyses: [
        {
          id: "analysis-1",
          checkedAt: "2026-11-11T15:39:33Z",
          score: 71,
          version: "1.0.0",
          results: [
            { ...result("copyrightowner", "pass"), requirementLevel: "mandatory" },
            { ...result("publiccode", "fail"), requirementLevel: "mandatory" },
          ],
        },
      ],
    });

    render(await AnalysisDetailPage({ params: Promise.resolve({ owner: "org", repo: "repo", analysisId: "analysis-1" }) }));

    // Ownership: copyright owner passes (5), publiccode.yml fails (1)
    expect(screen.getByRole("img", { name: "Overall rating 3.0 of 5.5, 3 stars" })).toBeTruthy();
    expect(screen.getByRole("img", { name: `${GOVERNANCE} rating 3.0 of 5.5, 3 stars` })).toBeTruthy();
    expect(screen.getByText("Does not pass")).toBeTruthy();
  });
});
