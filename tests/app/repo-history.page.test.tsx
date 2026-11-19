/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getRepoHistory = vi.hoisted(() => vi.fn());
const getAdminScoring = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ getRepoHistory, getAdminScoring }));

import RepoHistoryPage from "@/app/history/[owner]/[repo]/page";

describe("RepoHistoryPage", () => {
  afterEach(() => cleanup());

  it("shows each analysis's overall rating, computed for older analyses", async () => {
    getAdminScoring.mockRejectedValue(new Error("offline"));
    getRepoHistory.mockResolvedValue({
      repository: { owner: "org", name: "repo", metadata: { repoUrl: "https://github.com/org/repo", topics: [], stars: 0, forks: 0 } },
      analyses: [
        { id: "new", checkedAt: "2026-11-11T15:39:33Z", score: 71, rating: 3.4, categoryRatings: {}, aspectRatings: {}, endorsement: { passed: true, reasons: [] }, results: [] },
        {
          id: "old",
          checkedAt: "2026-11-01T15:39:33Z",
          score: 50,
          results: [{ id: "copyrightowner", status: "fail", requirementLevel: "mandatory" }],
        },
      ],
    });

    render(await RepoHistoryPage({ params: Promise.resolve({ owner: "org", repo: "repo" }) }));

    expect(screen.getByRole("img", { name: "Overall rating 3.4 of 5.5, 3 stars" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Overall rating 0.5 of 5.5, 1 star" })).toBeTruthy();
  });
});
