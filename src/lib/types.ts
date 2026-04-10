// Shared types across checkers and UI

export type CheckStatus = "pass" | "fail" | "warn" | "info";
export type RequirementLevel = "mandatory" | "recommended";

export interface VersionEvidence {
  source: "release" | "tag" | "manifest" | "readme" | "none";
  detail: string;
}

export interface CheckResult {
  id: string;
  title: string;
  /** Short description of what was checked */
  description: string;
  /** Whether this criterion is mandatory or recommended */
  requirementLevel?: RequirementLevel;
  status: CheckStatus;
  /** Detail message explaining why pass/fail */
  message: string;
  /** Optional evidence — file paths or URLs found */
  evidence?: string[];
  /** Link to the relevant Common Ground / standard reference */
  referenceUrl?: string;
}

export interface CheckReport {
  repoUrl: string;
  owner: string;
  repo: string;
  checkedAt: string;
  scoringConfigId: string | null;
  score: number; // 0-100
  results: CheckResult[];
  repoMeta: {
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    defaultBranch: string;
    topics: string[];
    license: string | null;
    version: string | null;
    versionEvidence: VersionEvidence;
  };
}
