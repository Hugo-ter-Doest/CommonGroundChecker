import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckResult, RequirementLevel } from "@/lib/types";

const ids = [
  "sourcecode",
  "openapi",
  "license",
  "publiccode",
  "docker",
  "dockerimage",
  "sbom",
  "documentation",
  "tests",
  "complexity",
  "contributing",
  "codeofconduct",
  "security",
  "semver",
  "fivelayer",
  "helmchart",
] as const;

const mocks = vi.hoisted(() => ({
  getRepoMeta: vi.fn(),
  getRepoTree: vi.fn(),
  getRepoVersion: vi.fn(),
  parseGitHubUrl: vi.fn(),
  checkOpenApi: vi.fn(),
  checkLicense: vi.fn(),
  checkPublicCode: vi.fn(),
  checkDocker: vi.fn(),
  checkDockerImage: vi.fn(),
  checkSbom: vi.fn(),
  checkDocumentation: vi.fn(),
  checkContributing: vi.fn(),
  checkCodeOfConduct: vi.fn(),
  checkSecurity: vi.fn(),
  checkTests: vi.fn(),
  checkComplexity: vi.fn(),
  checkSourceCode: vi.fn(),
  checkSemver: vi.fn(),
  checkFiveLayer: vi.fn(),
  checkHelmChart: vi.fn(),
  getActiveScoringConfig: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getRepoMeta: mocks.getRepoMeta,
  getRepoTree: mocks.getRepoTree,
  getRepoVersion: mocks.getRepoVersion,
  parseGitHubUrl: mocks.parseGitHubUrl,
}));

vi.mock("@/lib/checkers/openapi", () => ({ checkOpenApi: mocks.checkOpenApi }));
vi.mock("@/lib/checkers/license", () => ({ checkLicense: mocks.checkLicense }));
vi.mock("@/lib/checkers/publiccode", () => ({ checkPublicCode: mocks.checkPublicCode }));
vi.mock("@/lib/checkers/docker", () => ({ checkDocker: mocks.checkDocker }));
vi.mock("@/lib/checkers/dockerImage", () => ({ checkDockerImage: mocks.checkDockerImage }));
vi.mock("@/lib/checkers/sbom", () => ({ checkSbom: mocks.checkSbom }));
vi.mock("@/lib/checkers/documentation", () => ({ checkDocumentation: mocks.checkDocumentation }));
vi.mock("@/lib/checkers/contributing", () => ({ checkContributing: mocks.checkContributing }));
vi.mock("@/lib/checkers/codeofconduct", () => ({ checkCodeOfConduct: mocks.checkCodeOfConduct }));
vi.mock("@/lib/checkers/security", () => ({ checkSecurity: mocks.checkSecurity }));
vi.mock("@/lib/checkers/tests", () => ({ checkTests: mocks.checkTests }));
vi.mock("@/lib/checkers/complexity", () => ({ checkComplexity: mocks.checkComplexity }));
vi.mock("@/lib/checkers/sourcecode", () => ({ checkSourceCode: mocks.checkSourceCode }));
vi.mock("@/lib/checkers/semver", () => ({ checkSemver: mocks.checkSemver }));
vi.mock("@/lib/checkers/fiveLayer", () => ({ checkFiveLayer: mocks.checkFiveLayer }));
vi.mock("@/lib/checkers/helmchart", () => ({ checkHelmChart: mocks.checkHelmChart }));
vi.mock("@/lib/checkers/config", () => ({ getActiveScoringConfig: mocks.getActiveScoringConfig }));

import { runChecks } from "@/lib/checkers/index";

function resultFor(id: string, status: CheckResult["status"]): CheckResult {
  return {
    id,
    title: id,
    description: `${id} check`,
    status,
    message: `${id} ${status}`,
    evidence: [],
  };
}

function criterionConfig(
  defaultWeight: number,
  defaultRequirementLevel: RequirementLevel = "recommended"
) {
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        weight: defaultWeight,
        requirementLevel: defaultRequirementLevel,
      },
    ])
  ) as Record<string, { weight: number; requirementLevel: RequirementLevel }>;
}

describe("runChecks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.parseGitHubUrl.mockReturnValue({ owner: "org", repo: "repo" });
    mocks.getRepoMeta.mockResolvedValue({
      description: "Test repo",
      language: "TypeScript",
      stargazers_count: 1,
      forks_count: 2,
      default_branch: "main",
      topics: ["cg"],
      license: { spdx_id: "MIT", name: "MIT License" },
    });
    mocks.getRepoTree.mockResolvedValue(["src/main.ts", "README.md"]);
    mocks.getRepoVersion.mockResolvedValue({
      version: "v1.2.3",
      evidence: { source: "tag", detail: "tag v1.2.3" },
    });

    mocks.checkSourceCode.mockReturnValue(resultFor("sourcecode", "pass"));
    mocks.checkOpenApi.mockResolvedValue(resultFor("openapi", "pass"));
    mocks.checkLicense.mockResolvedValue(resultFor("license", "pass"));
    mocks.checkPublicCode.mockResolvedValue(resultFor("publiccode", "pass"));
    mocks.checkDocker.mockReturnValue(resultFor("docker", "pass"));
    mocks.checkDockerImage.mockReturnValue(resultFor("dockerimage", "pass"));
    mocks.checkSbom.mockReturnValue(resultFor("sbom", "pass"));
    mocks.checkDocumentation.mockReturnValue(resultFor("documentation", "pass"));
    mocks.checkTests.mockReturnValue(resultFor("tests", "pass"));
    mocks.checkComplexity.mockResolvedValue(resultFor("complexity", "pass"));
    mocks.checkContributing.mockReturnValue(resultFor("contributing", "pass"));
    mocks.checkCodeOfConduct.mockReturnValue(resultFor("codeofconduct", "pass"));
    mocks.checkSecurity.mockReturnValue(resultFor("security", "pass"));
    mocks.checkSemver.mockReturnValue(resultFor("semver", "pass"));
    mocks.checkFiveLayer.mockResolvedValue(resultFor("fivelayer", "pass"));
    mocks.checkHelmChart.mockResolvedValue(resultFor("helmchart", "pass"));
  });

  it("applies weighted scoring and non-register OpenAPI bypass", async () => {
    const configById = criterionConfig(0);
    configById.tests = { weight: 1, requirementLevel: "mandatory" };
    configById.semver = { weight: 1, requirementLevel: "mandatory" };

    mocks.checkTests.mockReturnValue(resultFor("tests", "warn"));
    mocks.checkSemver.mockReturnValue(resultFor("semver", "fail"));

    mocks.getActiveScoringConfig.mockResolvedValue({
      id: "cfg-1",
      config: {
        criterionConfigByCheckId: configById,
        statusScoreByStatus: { pass: 1, warn: 0.5, info: 0.5, fail: 0 },
        euplBonusPoints: 10,
        complexityThreshold: 12,
        complexityMaxCcnThreshold: 20,
      },
    });

    const report = await runChecks("https://github.com/org/repo", {
      isRegister: false,
    });

    expect(report.scoringConfigId).toBe("cfg-1");
    expect(report.score).toBe(25);
    expect(mocks.checkOpenApi).not.toHaveBeenCalled();

    const openApiResult = report.results.find((result) => result.id === "openapi");
    expect(openApiResult?.status).toBe("pass");
    expect(openApiResult?.message).toContain("not marked as a register");
  });

  it("adds EUPL bonus and caps score at 100", async () => {
    mocks.getRepoMeta.mockResolvedValue({
      description: "EUPL repo",
      language: "TypeScript",
      stargazers_count: 5,
      forks_count: 1,
      default_branch: "main",
      topics: [],
      license: { spdx_id: "EUPL-1.2", name: "European Union Public Licence" },
    });

    mocks.getActiveScoringConfig.mockResolvedValue({
      id: "cfg-2",
      config: {
        criterionConfigByCheckId: criterionConfig(1, "recommended"),
        statusScoreByStatus: { pass: 1, warn: 0.5, info: 0.5, fail: 0 },
        euplBonusPoints: 10,
        complexityThreshold: 12,
        complexityMaxCcnThreshold: 20,
      },
    });

    const report = await runChecks("https://github.com/org/repo", {
      isRegister: true,
    });

    expect(report.score).toBe(100);
    const licenseResult = report.results.find((result) => result.id === "license");
    expect(licenseResult?.message).toContain("bonus points applied");
  });
});