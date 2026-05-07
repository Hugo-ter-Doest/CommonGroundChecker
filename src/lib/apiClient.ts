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

function logApiRequest(method: string, path: string, body?: unknown) {
  const baseUrl = apiClient.request.config.BASE ?? "";
  const url = baseUrl ? `${baseUrl}${path}` : path;
  console.log("API request", { method, url, body });
}

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
  logApiRequest("GET", `/api/repositories?limit=${limit}`);
  const response = await apiClient.default.getApiRepositories(limit);
  return response.repositories ?? [];
}

export async function getRepoHistory(owner: string, repo: string, limit = 50) {
  logApiRequest("GET", `/api/repo-history?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&limit=${limit}`);
  return apiClient.default.getApiRepoHistory(owner, repo, limit);
}

export async function getAdminScoring() {
  logApiRequest("GET", "/api/admin/scoring");
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
  logApiRequest("POST", "/api/admin/scoring", payload);
  return apiClient.default.postApiAdminScoring(payload);
}

export async function postRepository(metadata: RepoMetadata) {
  logApiRequest("POST", "/api/repositories", metadata);
  return apiClient.default.postApiRepositories(metadata);
}

export async function postRepositoryAnalysis(repoId: string, input: RepoAnalysisInput) {
  logApiRequest("POST", `/api/repositories/${encodeURIComponent(repoId)}/analyses`, input);
  return apiClient.default.postApiRepositoriesAnalyses(repoId, input);
}

export async function postCheck(request: CheckRequest) {
  logApiRequest("POST", "/api/check", request);
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

  console.log("streamCheck request", {
    method: requestOptions.method,
    url,
    body: options,
  });

  const response = await fetch(url, {
    method: requestOptions.method,
    headers,
    body: JSON.stringify(options),
  });

  console.log("streamCheck response", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url,
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
      console.log("streamCheck event", payload);

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
