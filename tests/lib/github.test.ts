import { describe, expect, it } from "vitest";
import { parseGitHubTreeUrl, parseGitHubUrl } from "@/lib/github";

describe("github url parsing", () => {
  it("parses standard repository URLs", () => {
    expect(parseGitHubUrl("https://github.com/octocat/Hello-World")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
    });

    expect(parseGitHubUrl("https://github.com/octocat/Hello-World.git")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
    });
  });

  it("rejects non-github URLs", () => {
    expect(parseGitHubUrl("https://example.com/octocat/Hello-World")).toBeNull();
  });

  it("parses github tree/blob URLs", () => {
    expect(
      parseGitHubTreeUrl(
        "https://github.com/org/repo/tree/main/charts/my-chart"
      )
    ).toEqual({
      owner: "org",
      repo: "repo",
      branch: "main",
      path: "charts/my-chart",
    });
  });
});