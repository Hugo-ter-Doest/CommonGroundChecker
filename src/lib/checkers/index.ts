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

export type ProgressCallback = (step: string, pct: number) => void;

interface RunChecksOptions {
  helmChartLocations?: string[];
  documentationLocations?: string[];
  dockerLocations?: string[];
  isRegister?: boolean;
}

export async function runChecks(
  repoUrl: string,
  options?: RunChecksOptions,
  onProgress?: ProgressCallback,
): Promise<CheckReport> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub repository URL.");

  const { owner, repo } = parsed;

  // Fetch repo metadata first (needed to know default branch)
  onProgress?.("Fetching repository metadata\u2026", 15);
  const meta = await getRepoMeta(owner, repo);

  // Fetch file tree and version in parallel using the real default branch
  onProgress?.("Loading repository file tree\u2026", 30);
  const [tree, versionInfo] = await Promise.all([
    getRepoTree(owner, repo, meta.default_branch ?? "main"),
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

  // Kick off network-dependent and slow checks immediately so they run concurrently
  const networkChecksPromise = Promise.all([
    openApiCheckPromise,
    checkLicense(owner, repo, meta, tree),
    checkPublicCode(owner, repo, tree),
    checkFiveLayer(owner, repo, tree, meta),
    checkHelmChart(owner, repo, tree, options?.helmChartLocations ?? []),
  ]);
  const complexityPromise = checkComplexity(
    owner,
    repo,
    scoringConfig.complexityThreshold,
    scoringConfig.complexityMaxCcnThreshold
  );

  // Instant checks — synchronous pure functions on the tree array
  onProgress?.("Running code structure checks\u2026", 45);
  const sourcecode = checkSourceCode(tree);
  const docker = checkDocker(tree);
  const dockerimage = checkDockerImage(options?.dockerLocations ?? []);
  const sbom = checkSbom(tree);
  const documentation = checkDocumentation(tree, options?.documentationLocations ?? []);
  const tests = checkTests(tree);
  const contributing = checkContributing(tree);
  const codeofconduct = checkCodeOfConduct(tree);
  const security = checkSecurity(tree);
  const semver = checkSemver(version);

  // Instant checks done; emit next step while slower checks complete in parallel
  onProgress?.("Analysing API specs, licence & deployment files\u2026", 60);
  const [[openapi, license, publiccode, fivelayer, helmchart], complexity] = await Promise.all([
    networkChecksPromise,
    complexityPromise,
  ]);

  onProgress?.("Calculating compliance score\u2026", 90);

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
