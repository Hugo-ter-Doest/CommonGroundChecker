import type { CheckReport } from "@/lib/types";
import { ApiClient } from "@/generated/openapi-client";
import type { ApiRequestOptions } from "@/generated/openapi-client/core/ApiRequestOptions";
import { getHeaders } from "@/generated/openapi-client/core/request";
import type {
  CheckRequest,
  RepoAnalysisInput,
  RepoAnalysisOutput,
  RepoHistoryResponse,
  RepoMetadata,
  RepoSummary,
  ScoringConfigResponse,
} from "@/generated/openapi-client";

const apiBaseUrl = process.env.URL?.replace(/\/$/, "") ?? "";
const apiClient = new ApiClient({ BASE: apiBaseUrl });

export type {
  CheckRequest,
  RepoSummary,
  RepoMetadata,
  RepoAnalysisInput,
  RepoAnalysisOutput,
  RepoHistoryResponse,
  ScoringConfigResponse,
};

interface StreamOptions {
  repoUrl: string;
  helmChartLocations?: string[];
  documentationLocations?: string[];
  dockerLocations?: string[];
  apiSpecificationLocations?: string[];
  isRegister?: boolean;
}

interface StreamProgressEvent {
  step: string;
  pct: number;
  done?: true;
  result?: CheckReport;
  error?: string;
}

export async function getRepositories(limit = 12) {
  const response = await apiClient.default.getApiRepositories(limit);
  return response.repositories ?? [];
}

export async function getRepoHistory(owner: string, repo: string, limit = 50) {
  return apiClient.default.getApiRepoHistory(owner, repo, limit);
}

export async function getAdminScoring() {
  return apiClient.default.getApiAdminScoring();
}

export async function postAdminScoring(payload: {
  reset?: boolean;
  criterionWeights?: Record<string, number>;
  criterionRequirementLevels?: Record<string, "mandatory" | "recommended">;
  complexityThreshold?: number;
  complexityMaxCcnThreshold?: number;
  spectralRulesetSource?: string;
}) {
  return apiClient.default.postApiAdminScoring(payload);
}

export async function postRepository(metadata: RepoMetadata) {
  return apiClient.default.postApiRepositories(metadata);
}

export async function postRepositoryAnalysis(repoId: string, input: RepoAnalysisInput) {
  return apiClient.default.postApiRepositoriesAnalyses(repoId, input);
}

export async function postCheck(request: CheckRequest) {
  return apiClient.default.postApiCheck(request);
}

export async function streamCheck(
  options: StreamOptions,
  onProgress?: (step: string, pct: number) => void
) {
  const requestOptions: ApiRequestOptions = {
    method: "POST",
    url: "/api/check/stream",
    body: options,
    mediaType: "application/json",
  };

  const baseUrl = apiClient.request.config.BASE?.toString().replace(/\/$/, "") ?? "";
  const url = baseUrl ? `${baseUrl}/api/check/stream` : "/api/check/stream";
  const headers = await getHeaders(apiClient.request.config, requestOptions);

  const response = await fetch(url, {
    method: requestOptions.method,
    headers,
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

      const payload = JSON.parse(dataLine.slice(6)) as StreamProgressEvent;

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
