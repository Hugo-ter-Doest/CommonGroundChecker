import { describe, expect, it } from "vitest";
import { checkSbom } from "@/lib/checkers/sbom";
import type { RepoContext } from "@/lib/providers/types";

const baseContext = {
  owner: "org",
  repo: "repo",
  projectPath: "org/repo",
  repoUrl: "https://github.com/org/repo",
  provider: {
    id: "github",
    hostname: "github.com",
    parseRepoUrl: () => null,
    getRepoMeta: async () => ({}),
    getRepoTree: async () => [],
    getFileContent: async () => null,
    getRepoVersion: async () => ({
      version: null,
      evidence: { source: "none", detail: "" },
    }),
    getCloneUrl: () => "",
  },
} as unknown as RepoContext;

describe("checkSbom", () => {
  it("passes and extracts dependency count from CycloneDX JSON", async () => {
    const context = {
      ...baseContext,
      provider: {
        ...baseContext.provider,
        getFileContent: async () =>
          JSON.stringify({ bom: { components: [{}, {}, {}] } }),
      },
    } as RepoContext;

    const result = await checkSbom(context, ["sbom.cdx.json"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("3 dependencies");
    expect(result.evidence).toContain("sbom.cdx.json");
  });

  it("passes and extracts dependency count from SPDX JSON", async () => {
    const context = {
      ...baseContext,
      provider: {
        ...baseContext.provider,
        getFileContent: async () => JSON.stringify({ packages: [{}, {}] }),
      },
    } as RepoContext;

    const result = await checkSbom(context, ["spdx.json"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("2 dependencies");
    expect(result.evidence).toContain("spdx.json");
  });

  it("warns when no SBOM file is present", async () => {
    const result = await checkSbom(baseContext, ["README.md"]);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("No SBOM file found");
  });
});
