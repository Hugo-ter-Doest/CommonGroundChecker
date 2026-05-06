import { describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/github", () => ({
  getRepoTree: vi.fn(),
  parseGitHubTreeUrl: (url: string) => {
    try {
      const u = new URL(url.trim());
      if (u.hostname !== "github.com") return null;
      const parts = u.pathname.replace(/^\//, "").split("/");
      if (parts.length < 5) return null;
      const [owner, repo, mode, branch, ...rest] = parts;
      if (mode !== "tree" && mode !== "blob") return null;
      const path = rest.join("/").replace(/^\/+|\/+$/g, "");
      return { owner, repo: repo.replace(/\.git$/, ""), branch, path };
    } catch {
      return null;
    }
  },
}));

import { getRepoTree } from "@/lib/github";
import { checkHelmChart } from "@/lib/checkers/helmchart";

describe("checkHelmChart", () => {
  it("passes when a Chart.yaml exists in the repository tree", async () => {
    const result = await checkHelmChart("org", "repo", ["Chart.yaml", "README.md"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("Helm chart detected");
    expect(result.evidence).toContain("Chart.yaml");
  });

  it("passes when a Chart.yaml exists in a nested chart folder", async () => {
    const result = await checkHelmChart("org", "repo", ["charts/my-component/Chart.yaml"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain("charts/my-component/Chart.yaml");
  });

  it("fails when no Chart.yaml exists", async () => {
    const result = await checkHelmChart("org", "repo", ["README.md", "deployment.yaml"]);

    expect(result.status).toBe("fail");
    expect(result.message).toContain("No Helm chart");
    expect(result.evidence).toEqual([]);
  });

  it("includes provided helm locations as evidence", async () => {
    const result = await checkHelmChart("org", "repo", ["charts/my-component/Chart.yaml"], ["charts/my-component"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain("Provided helm locations: charts/my-component");
  });

  it("passes when a Helm chart is detected from an explicit GitHub URL hint", async () => {
    (getRepoTree as unknown as Mock).mockResolvedValueOnce(["charts/my-component/Chart.yaml"]);

    const result = await checkHelmChart(
      "org",
      "repo",
      ["README.md"],
      ["https://github.com/org/repo/tree/main/charts/my-component"]
    );

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain(
      "External Helm chart detected: https://github.com/org/repo/tree/main/charts/my-component"
    );
  });
});
