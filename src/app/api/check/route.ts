import { runChecks } from "@/lib/checkers";
import { parseGitHubUrl } from "@/lib/github";
import type { CheckResult as ApiCheckResult } from "@/generated/openapi-client/models/CheckResult";
import {
  postRepository,
  postRepositoryAnalysis,
  type RepoMetadata,
  type RepoAnalysisInput,
} from "@/lib/apiClient";

function normalizeLocations(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
    : [];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function toApiString(value: string | null): string | undefined {
  return value ?? undefined;
}

function toApiCheckResult(result: import("@/lib/types").CheckResult): ApiCheckResult {
  return {
    ...result,
    requirementLevel: result.requirementLevel as ApiCheckResult["requirementLevel"],
    status: result.status as ApiCheckResult["status"],
    confidence: result.confidence as ApiCheckResult["confidence"],
  };
}

export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const repoUrl = typeof body?.repoUrl === "string" ? body.repoUrl : "";
    const helmChartLocations = normalizeLocations(body?.helmChartLocations);
    const documentationLocations = normalizeLocations(body?.documentationLocations);
    const dockerLocations = normalizeLocations(body?.dockerLocations);
    const apiSpecificationLocations = normalizeLocations(body?.apiSpecificationLocations);
    const isRegister = body?.isRegister === true;

    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: repoUrl" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    if (!parseGitHubUrl(repoUrl)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid GitHub URL. Please provide a URL like https://github.com/owner/repo",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const report = await runChecks(repoUrl, {
      helmChartLocations,
      documentationLocations,
      dockerLocations,
      apiSpecificationLocations,
      isRegister,
    });

    const repositoryMetadata: RepoMetadata = {
      repoUrl: report.repoUrl,
      description: toApiString(report.repoMeta.description),
      language: toApiString(report.repoMeta.language),
      stars: report.repoMeta.stars,
      forks: report.repoMeta.forks,
      defaultBranch: report.repoMeta.defaultBranch,
      topics: report.repoMeta.topics,
      license: toApiString(report.repoMeta.license),
      version: toApiString(report.repoMeta.version),
      versionEvidenceSource: report.repoMeta.versionEvidence.source,
      versionEvidenceDetail: report.repoMeta.versionEvidence.detail,
      helmChartLocations,
      dockerLocations,
      apiSpecificationLocations,
      documentationLocations,
    };

    try {
      const savedRepo = await postRepository(repositoryMetadata);

      const analysisInput: RepoAnalysisInput = {
        scoringConfigId: report.scoringConfigId,
        checkedAt: report.checkedAt,
        version: toApiString(report.repoMeta.version) ?? null,
        score: report.score,
        results: report.results.map(toApiCheckResult),
      };

      await postRepositoryAnalysis(savedRepo.id, analysisInput);
    } catch (storageError) {
      console.error("Remote storage failed:", storageError);
    }

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const isNotFound = message.includes("404");
    const isRateLimited = /rate limit exceeded|api rate limit exceeded/i.test(
      message
    );
    const status = isRateLimited ? 429 : isNotFound ? 404 : 500;
    const errorMessage = isRateLimited
      ? "GitHub API rate limit reached. Add GITHUB_TOKEN in .env for higher limits, then restart the app."
      : isNotFound
      ? "Repository not found. Make sure it is public and the URL is correct."
      : message;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    });
  }
}
