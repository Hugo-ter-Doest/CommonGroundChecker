import { getRepoMeta, getRepoTree, getRepoVersion, parseGitHubUrl } from "../github";
import type { CheckReport, CheckResult } from "../types";
import { checkOpenApi } from "./openapi";
import { checkLicense } from "./license";
import { checkPublicCode } from "./publiccode";
import { checkDocker } from "./docker";
import { checkDockerImage } from "./dockerImage";
import { checkFiveLayer } from "./fiveLayer";
import { checkHelmChart } from "./helmchart";
import { checkSbom } from "./sbom";
import { checkDocumentation } from "./documentation";
import { checkContributing } from "./contributing";
import { checkCodeOfConduct } from "./codeofconduct";
import { checkSecurity } from "./security";
import { checkTests } from "./tests";
import { checkComplexity } from "./complexity";
import { checkSourceCode } from "./sourcecode";
import { checkSemver } from "./semver";
import {
  getActiveScoringConfig,
} from "./config";

function isEuplLicense(
  licenseResultMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoMeta: any
): boolean {
  const spdx = String(repoMeta?.license?.spdx_id ?? "").toLowerCase();
  const name = String(repoMeta?.license?.name ?? "").toLowerCase();
  const message = String(licenseResultMessage ?? "").toLowerCase();

  return (
    spdx.startsWith("eupl") ||
    name.includes("eupl") ||
    name.includes("european union public licen") ||
    message.includes("eupl") ||
    message.includes("european union public licen")
  );
}

interface RunChecksOptions {
  helmChartLocations?: string[];
  documentationLocations?: string[];
  dockerLocations?: string[];
  isRegister?: boolean;
}

export async function runChecks(
  repoUrl: string,
  options?: RunChecksOptions
): Promise<CheckReport> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub repository URL.");

  const { owner, repo } = parsed;

  // Fetch meta and tree in parallel
  const [meta, tree, versionInfo] = await Promise.all([
    getRepoMeta(owner, repo),
    (async () => {
      const branch =
        (await getRepoMeta(owner, repo)).default_branch ?? "main";
      return getRepoTree(owner, repo, branch);
    })(),
    getRepoVersion(owner, repo),
  ]);

  const version = versionInfo.version;
  const activeScoringConfig = await getActiveScoringConfig();
  const scoringConfig = activeScoringConfig.config;
  const isRegister = options?.isRegister === true;

  const openApiCheckPromise: Promise<CheckResult> = isRegister
    ? checkOpenApi(owner, repo, tree)
    : Promise.resolve({
        id: "openapi",
        title: "API-first / OpenAPI Specification",
        description:
          "The component must expose a machine-readable OpenAPI (or Swagger) specification.",
        status: "pass",
        message:
          "Component is not marked as a register; OpenAPI specification check is not required.",
        evidence: [],
        referenceUrl: "https://commonground.nl/cms/view/54476259/api-designrules",
      });

  // Run all checkers in parallel
  const [sourcecode, openapi, license, publiccode, docker, dockerimage, sbom, documentation, tests, complexity, contributing, codeofconduct, security, semver, fivelayer, helmchart] = await Promise.all([
    Promise.resolve(checkSourceCode(tree)),
    openApiCheckPromise,
    checkLicense(owner, repo, meta, tree),
    checkPublicCode(owner, repo, tree),
    Promise.resolve(checkDocker(tree)),
    Promise.resolve(checkDockerImage(options?.dockerLocations ?? [])),
    Promise.resolve(checkSbom(tree)),
    Promise.resolve(
      checkDocumentation(tree, options?.documentationLocations ?? [])
    ),
    Promise.resolve(checkTests(tree)),
    checkComplexity(owner, repo, scoringConfig.complexityThreshold),
    Promise.resolve(checkContributing(tree)),
    Promise.resolve(checkCodeOfConduct(tree)),
    Promise.resolve(checkSecurity(tree)),
    Promise.resolve(checkSemver(version)),
    checkFiveLayer(owner, repo, tree, meta),
    checkHelmChart(owner, repo, tree, options?.helmChartLocations ?? []),
  ]);

  const results = [
    sourcecode,
    openapi,
    license,
    publiccode,
    docker,
    dockerimage,
    sbom,
    documentation,
    tests,
    complexity,
    contributing,
    codeofconduct,
    security,
    semver,
    fivelayer,
    helmchart,
  ];

  const totalCriterionWeight = results.reduce((sum, result) => {
    const criterionWeight =
      scoringConfig.criterionConfigByCheckId[result.id]?.weight ?? 1;
    return sum + Math.max(0, criterionWeight);
  }, 0);

  const weightedScoreSum = results.reduce((sum, result) => {
    const criterionWeight =
      scoringConfig.criterionConfigByCheckId[result.id]?.weight ?? 1;
    const statusScore = scoringConfig.statusScoreByStatus[result.status] ?? 0;
    return sum + statusScore * Math.max(0, criterionWeight);
  }, 0);

  const baseScore = totalCriterionWeight > 0
    ? Math.round((weightedScoreSum / totalCriterionWeight) * 100)
    : 0;
  const euplBonus = isEuplLicense(license.message, meta)
    ? scoringConfig.euplBonusPoints
    : 0;
  const score = Math.min(100, baseScore + euplBonus);

  const licenseResult =
    euplBonus > 0
      ? {
          ...license,
          message: `${license.message} EUPL detected: +${euplBonus} bonus points applied to total score.`,
        }
      : license;

  const resultsWithBonusMessage = [
    sourcecode,
    openapi,
    licenseResult,
    publiccode,
    docker,
    dockerimage,
    sbom,
    documentation,
    tests,
    complexity,
    contributing,
    codeofconduct,
    security,
    semver,
    fivelayer,
    helmchart,
  ];

  const resultsWithRequirementLevels = resultsWithBonusMessage.map((result) => ({
    ...result,
    requirementLevel:
      scoringConfig.criterionConfigByCheckId[result.id]?.requirementLevel ??
      "recommended",
  }));

  return {
    repoUrl,
    owner,
    repo,
    checkedAt: new Date().toISOString(),
    scoringConfigId: activeScoringConfig.id,
    score,
    results: resultsWithRequirementLevels,
    repoMeta: {
      description: meta.description ?? null,
      language: meta.language ?? null,
      stars: meta.stargazers_count ?? 0,
      forks: meta.forks_count ?? 0,
      defaultBranch: meta.default_branch ?? "main",
      topics: meta.topics ?? [],
      license: meta.license?.name ?? null,
      version,
      versionEvidence: versionInfo.evidence,
    },
  };
}
