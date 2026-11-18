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
  /** Raw measurements of the open track by measure, kept unrated so they can be banded later */
  openTrack?: OpenTrackMeasures;
}

/** Fan-in bands of the module-coupling risk profile: up to 10, 11 to 20, 21 to 50 and over 50 depending modules. */
export type FanInBand = "low" | "moderate" | "high" | "veryHigh";

/** The coupling measurements of one language, from one tool's module dependency graph. */
export interface MeasuredCoupling {
  measured: true;
  /** Tool and version that produced the graph */
  tool: string;
  /** Which files were measured, when that is narrower than the production scope */
  scope?: string;
  modules: number;
  edges: number;
  loc: number;
  componentDefinition: string;
  components: number;
  /** Share of code in modules no other component depends on, 0 to 1 */
  componentIndependence: number;
  componentEntanglement: {
    violationDegree: number;
    density: number;
    communicationLines: number;
    violations: Record<string, number>;
  };
  moduleCoupling: {
    /** Upper fan-in of the low, moderate and high bands */
    bounds: number[];
    /** Share of code per fan-in band, 0 to 1 */
    riskProfile: Record<FanInBand, number>;
    /** Share of code above each bound, 0 to 1 */
    above: number[];
    highestFanIn: { module: string; fanIn: number }[];
  };
  cycles: {
    moduleCycles: number;
    modulesInCycles: number;
    locShareInCycles: number;
    largestModuleCycle: number;
    componentCycles: number;
    largestComponentCycle: number;
  };
  /** PHP: the number of pdepend runs */
  batches?: number;
  /** Python: the repository's own import-linter contracts; null when it declares none */
  contracts?: { kept: number; broken: number } | { error: string } | null;
  /** JavaScript: relative or aliased imports dependency-cruiser could not resolve */
  unresolvedLocalImports?: number;
}

export interface UnmeasuredCoupling {
  measured: false;
  reason: string;
  files: number;
}

/** The open-track coupling report, per language group (php, python, javascript). */
export interface CouplingMeasures {
  version: number;
  languages: Record<string, MeasuredCoupling | UnmeasuredCoupling>;
}

export interface OpenTrackMeasures {
  coupling?: CouplingMeasures;
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
