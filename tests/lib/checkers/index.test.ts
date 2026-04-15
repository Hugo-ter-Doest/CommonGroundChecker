import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckResult, RequirementLevel } from "@/lib/types";

const ids = [
  "sourcecode",
  "openapi",
  "license",
  "eupllicense",
  "copyrightowner",
  "publiccode",
  "docker",
  "dockerimage",
  "sbom",
  "documentation",
  "tests",
  "complexity",
  "codemetrics",
  "owaspsecurecoding",
  "adrvalidator",
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
  getFileContent: vi.fn(),
  parseGitHubUrl: vi.fn(),
  checkOpenApi: vi.fn(),
  checkLicense: vi.fn(),
  checkPublicCode: vi.fn(),
  checkCopyrightOwner: vi.fn(),
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
  checkCodeMetrics: vi.fn(),
  checkOwaspSecureCoding: vi.fn(),
  checkEuplLicense: vi.fn(),
  checkAdrValidator: vi.fn(),
  getActiveScoringConfig: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getRepoMeta: mocks.getRepoMeta,
  getRepoTree: mocks.getRepoTree,
  getRepoVersion: mocks.getRepoVersion,
  getFileContent: mocks.getFileContent,
  parseGitHubUrl: mocks.parseGitHubUrl,
}));

vi.mock("@/lib/checkers/openapi", () => ({ checkOpenApi: mocks.checkOpenApi }));
vi.mock("@/lib/checkers/license", () => ({ checkLicense: mocks.checkLicense }));
vi.mock("@/lib/checkers/copyrightOwner", () => ({ checkCopyrightOwner: mocks.checkCopyrightOwner }));
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
vi.mock("@/lib/checkers/codeMetrics", () => ({ checkCodeMetrics: mocks.checkCodeMetrics }));
vi.mock("@/lib/checkers/owaspSecureCoding", () => ({ checkOwaspSecureCoding: mocks.checkOwaspSecureCoding }));
vi.mock("@/lib/checkers/eupl", () => ({
  checkEuplLicense: mocks.checkEuplLicense,
}));
vi.mock("@/lib/checkers/adrValidator", () => ({ checkAdrValidator: mocks.checkAdrValidator }));
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
    mocks.checkEuplLicense.mockReturnValue(resultFor("eupllicense", "warn"));
    mocks.checkCopyrightOwner.mockResolvedValue(resultFor("copyrightowner", "pass"));
    mocks.checkPublicCode.mockResolvedValue(resultFor("publiccode", "pass"));
    mocks.checkDocker.mockReturnValue(resultFor("docker", "pass"));
    mocks.checkDockerImage.mockReturnValue(resultFor("dockerimage", "pass"));
    mocks.checkSbom.mockReturnValue(resultFor("sbom", "pass"));
    mocks.checkDocumentation.mockReturnValue(resultFor("documentation", "pass"));
    mocks.checkTests.mockReturnValue(resultFor("tests", "pass"));
    mocks.checkComplexity.mockResolvedValue(resultFor("complexity", "pass"));
    mocks.checkCodeMetrics.mockResolvedValue(resultFor("codemetrics", "info"));
    mocks.checkOwaspSecureCoding.mockResolvedValue(resultFor("owaspsecurecoding", "pass"));
    mocks.checkAdrValidator.mockResolvedValue(resultFor("adrvalidator", "pass"));
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
        complexityThreshold: 12,
        complexityMaxCcnThreshold: 20,
        spectralRulesetSource: "https://static.developer.overheid.nl/adr/ruleset.yaml",
      },
    });

    const report = await runChecks("https://github.com/org/repo", {
      isRegister: false,
    });

    expect(report.scoringConfigId).toBe("cfg-1");
    expect(report.score).toBe(25);
    expect(mocks.checkOpenApi).not.toHaveBeenCalled();
    expect(report.results).toHaveLength(20);

    const openApiResult = report.results.find((result) => result.id === "openapi");
    expect(openApiResult?.status).toBe("pass");
    expect(openApiResult?.message).toContain("not marked as a register");
  });

  it("does not apply extra EUPL bonus points", async () => {
    mocks.getRepoMeta.mockResolvedValue({
      description: "EUPL repo",
      language: "TypeScript",
      stargazers_count: 5,
      forks_count: 1,
      default_branch: "main",
      topics: [],
      license: { spdx_id: "EUPL-1.2", name: "European Union Public Licence" },
    });

    const configById = criterionConfig(1, "mandatory");
    configById.semver = { weight: 1, requirementLevel: "mandatory" };
    mocks.checkSemver.mockReturnValue(resultFor("semver", "fail"));

    mocks.getActiveScoringConfig.mockResolvedValue({
      id: "cfg-2",
      config: {
        criterionConfigByCheckId: configById,
        statusScoreByStatus: { pass: 1, warn: 0.5, info: 0.5, fail: 0 },
        complexityThreshold: 12,
        complexityMaxCcnThreshold: 20,
        spectralRulesetSource: "https://static.developer.overheid.nl/adr/ruleset.yaml",
      },
    });

    const report = await runChecks("https://github.com/org/repo", {
      isRegister: true,
    });

    expect(report.score).toBeLessThan(100);
    const licenseResult = report.results.find((result) => result.id === "license");
    expect(licenseResult?.message).not.toContain("bonus points applied");
  });

  it("merges code metrics into Actual Source Code result", async () => {
    // Arrange: code metrics returns a metrics message
    mocks.checkSourceCode.mockReturnValue({
      id: "sourcecode",
      title: "Actual Source Code",
      description: "desc",
      status: "pass",
      message: "Found 10 source code file(s).",
      evidence: ["file1.js", "file2.py"],
    });
    mocks.checkCodeMetrics.mockResolvedValue({
      id: "codemetrics",
      title: "Code Metrics",
      description: "desc",
      status: "info",
      message: "Code metrics collected: 1,234 lines of code, 56 functions across 12 files.",
      evidence: ["Analyzer: lizard", "Total lines of code (NLOC): 1,234", "Function count: 56", "Files analyzed: 12"],
    });

    mocks.getActiveScoringConfig.mockResolvedValue({
      id: "cfg-metrics",
      config: {
        criterionConfigByCheckId: criterionConfig(1, "mandatory"),
        statusScoreByStatus: { pass: 1, warn: 0.5, info: 0.5, fail: 0 },
        complexityThreshold: 12,
        complexityMaxCcnThreshold: 20,
        spectralRulesetSource: "https://static.developer.overheid.nl/adr/ruleset.yaml",
      },
    });

    // Act
    const report = await runChecks("https://github.com/org/repo");
    const sourceCodeResult = report.results.find((r) => r.id === "sourcecode");

    // Assert
    expect(sourceCodeResult).toBeDefined();
    expect(sourceCodeResult?.message).toContain("Code metrics:");
    expect(sourceCodeResult?.message).not.toContain("Found 10 source code file(s).");
    expect(sourceCodeResult?.message).toContain("1,234 lines of code");
    expect(sourceCodeResult?.message).toContain("56 functions");
    expect(sourceCodeResult?.message).toContain("12 files analyzed");
    expect(sourceCodeResult?.evidence).toContain("file1.js");
    expect(sourceCodeResult?.evidence).toContain("file2.py");
    expect(sourceCodeResult?.evidence).toContain("Analyzer: lizard");
  });
});