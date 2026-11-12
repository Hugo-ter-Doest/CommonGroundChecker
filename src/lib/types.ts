// Shared types across checkers and UI

export type CheckStatus = "pass" | "fail" | "warn" | "info";
export type RequirementLevel = "mandatory" | "recommended" | "informative";
export type ConfidenceLevel = "high" | "medium" | "low";
export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface VersionEvidence {
  source: "release" | "tag" | "manifest" | "readme" | "none";
  detail: string;
}

export interface CheckResult {
  id: string;
  title: string;
  /** Short description of what was checked */
  description: string;
  /** Whether this criterion is mandatory, recommended, or informative */
  requirementLevel?: RequirementLevel;
  status: CheckStatus;
  /** Detail message explaining why pass/fail */
  message: string;
  /** Optional evidence — file paths or URLs found */
  evidence?: string[];
  /** Link to the relevant Common Ground / standard reference */
  referenceUrl?: string;
  /** Optional confidence level for inferred/heuristic checks */
  confidence?: ConfidenceLevel;
  /** 1 to 5 stars; from the criterion's own scale, or derived from its status */
  starRating?: StarRating;
  /** Continuous rating from 0.5 to 5.5, for a criterion measured on a continuous scale */
  rating?: number;
  /** Ratings from 0.5 to 5.5 the check measures for aspects of the rating model, by key */
  aspectRatings?: Record<string, number | null>;
}

export interface AspectRating {
  /** Rating from 0.5 to 5.5, or null when none of its inputs count */
  rating: number | null;
  /** For a document-count aspect: the inputs that pass */
  found?: number;
  /** For a document-count aspect: the inputs that were measured */
  expected?: number;
}

export interface Endorsement {
  /** No mandatory criterion fails and the overall rating is at least 2.5 */
  passed: boolean;
  reasons: string[];
}

/** Repository details read from publiccode.yml */
export interface PublicCodeDetails {
  displayName: string | null;
  shortDescription: string | null;
  /** Absolute http(s) URL of the logo */
  logoUrl: string | null;
  developmentStatus: string | null;
  maintenanceType: string | null;
  maintainers: string[];
}

export interface CheckReport {
  repoUrl: string;
  owner: string;
  repo: string;
  checkedAt: string;
  scoringConfigId: string | null;
  score: number; // 0-100
  /** Overall rating from 0.5 to 5.5, or null when no criterion counts */
  rating: number | null;
  /** Rating per category, or null for a category without counted criteria */
  categoryRatings: Record<string, number | null>;
  /** Rating per aspect id */
  aspectRatings: Record<string, AspectRating>;
  endorsement: Endorsement;
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
  } & PublicCodeDetails;
}
