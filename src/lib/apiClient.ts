import type { CheckReport, CheckResult } from "@/lib/types";

export interface RepoSummary {
  id: string;
  owner: string;
  name: string;
  repoUrl: string;
  helmChartLocations: string[];
  dockerLocations: string[];
  apiSpecificationLocations: string[];
  documentationLocations: string[];
  updatedAt: string;
  analysisCount: number;
  latestAnalysis: { checkedAt: string; score: number } | null;
}

export interface RepoMetadata {
  repoUrl: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  defaultBranch?: string;
  topics?: string[];
  license?: string;
  version?: string;
  versionEvidenceSource?: string;
  versionEvidenceDetail?: string;
  helmChartLocations?: string[];
  dockerLocations?: string[];
  apiSpecificationLocations?: string[];
  documentationLocations?: string[];
}

export interface RepoAnalysisInput {
  scoringConfigId?: string | null;
  checkedAt: string;
  version?: string | null;
  score: number;
  results: CheckResult[];
}

export interface RepoAnalysisOutput extends RepoAnalysisInput {
  id: string;
  repoId: string;
  createdAt: string;
}

export interface RepoMeta {
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  defaultBranch: string;
  topics: string[];
  license: string | null;
  version: string | null;
  versionEvidence: {
    source: "release" | "tag" | "manifest" | "readme" | "none";
    detail: string;
  };
}

export interface RepoHistoryResponse {
  repository: {
    id: string;
    repoUrl: string;
    owner: string;
    name: string;
    metadata: RepoMeta;
    createdAt: string;
    updatedAt: string;
  };
  analyses: RepoAnalysisOutput[];
}

export interface ScoringConfigResponse {
  ok?: boolean;
  scoringConfigId: string | null;
  complexityThreshold: number;
  complexityMaxCcnThreshold: number;
  spectralRulesetSource: string;
  criterionWeights: Record<string, number>;
  criterionRequirementLevels: Record<string, "mandatory" | "recommended">;
  defaultCriterionWeights?: Record<string, number>;
  defaultCriterionRequirementLevels?: Record<
    string,
    "mandatory" | "recommended" | "informative"
  >;
  defaultComplexityThreshold?: number;
  defaultComplexityMaxCcnThreshold?: number;
  defaultSpectralRulesetSource?: string;
}

interface ErrorResponse {
  error: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = data?.error ?? `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return data as T;
}

async function apiFetch<T>(input: string, init: RequestInit = {}) {
  const response = await fetch(input, init);
  return parseResponse<T>(response);
}

export async function getRepositories(limit = 12) {
  const query = new URLSearchParams({ limit: String(limit) });
  const data = await apiFetch<{ repositories: RepoSummary[] }>(
    `/api/repositories?${query.toString()}`,
    { cache: "no-store" }
  );
  return data.repositories;
}

export async function getRepoHistory(owner: string, repo: string, limit = 50) {
  const query = new URLSearchParams({
    owner,
    repo,
    limit: String(limit),
  });
  return apiFetch<RepoHistoryResponse>(`/api/repo-history?${query.toString()}`, {
    cache: "no-store",
  });
}

export async function getAdminScoring() {
  return apiFetch<ScoringConfigResponse>("/api/admin/scoring", {
    cache: "no-store",
  });
}

export async function postAdminScoring(payload: {
  reset?: boolean;
  criterionWeights?: Record<string, number>;
  criterionRequirementLevels?: Record<string, "mandatory" | "recommended">;
  complexityThreshold?: number;
  complexityMaxCcnThreshold?: number;
  spectralRulesetSource?: string;
}) {
  return apiFetch<ScoringConfigResponse>("/api/admin/scoring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postRepository(metadata: RepoMetadata) {
  return apiFetch<RepoSummary>("/api/repositories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
}

export async function postRepositoryAnalysis(
  repoId: string,
  input: RepoAnalysisInput
) {
  return apiFetch<RepoAnalysisOutput>(`/api/repositories/${encodeURIComponent(repoId)}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function streamCheck(
  options: {
    repoUrl: string;
    helmChartLocations?: string[];
    documentationLocations?: string[];
    dockerLocations?: string[];
    apiSpecificationLocations?: string[];
    isRegister?: boolean;
  },
  onProgress?: (step: string, pct: number) => void
) {
  const response = await fetch("/api/check/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!response.body) {
    throw new Error("No response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;

      const payload = JSON.parse(dataLine.slice(6)) as {
        step: string;
        pct: number;
        done?: true;
        result?: CheckReport;
        error?: string;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }

      onProgress?.(payload.step, payload.pct);

      if (payload.done && payload.result) {
        return payload.result;
      }
    }
  }

  throw new Error("Stream ended without producing a result.");
}
