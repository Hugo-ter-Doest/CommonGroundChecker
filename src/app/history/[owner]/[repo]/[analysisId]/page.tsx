import Link from "next/link";
import ResultCard from "@/components/ResultCard";
import { prisma } from "@/lib/db";
import type { CheckReport, CheckResult } from "@/lib/types";
import { CATEGORY_ORDER, RESULT_CATEGORY_BY_ID, RESULT_ORDER_BY_ID } from "@/lib/criteria";

interface AnalysisDetailPageProps {
  params: Promise<{
    owner: string;
    repo: string;
    analysisId: string;
  }>;
}

function badgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-red-100 text-red-700 border-red-300";
}

function normalizeResults(raw: unknown): CheckResult[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const requirementLevel =
        item.requirementLevel === "mandatory" ||
        item.requirementLevel === "recommended" ||
        item.requirementLevel === "informative"
          ? item.requirementLevel
          : undefined;

      return {
        id: typeof item.id === "string" ? item.id : "unknown",
        title: typeof item.title === "string" ? item.title : "Unknown check",
        description: typeof item.description === "string" ? item.description : "",
        requirementLevel,
        confidence:
          item.confidence === "high" ||
          item.confidence === "medium" ||
          item.confidence === "low"
            ? item.confidence
            : undefined,
        status:
          item.status === "pass" ||
          item.status === "warn" ||
          item.status === "fail" ||
          item.status === "info"
            ? item.status
            : "info",
        message:
          typeof item.message === "string" ? item.message : "No detail message available.",
        evidence: Array.isArray(item.evidence)
          ? item.evidence.filter((value): value is string => typeof value === "string")
          : [],
        referenceUrl:
          typeof item.referenceUrl === "string" ? item.referenceUrl : undefined,
      } satisfies CheckResult;
    });
}

function normalizeRepoMeta(raw: {
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  defaultBranch: string | null;
  topics: string[];
  license: string | null;
  version: string | null;
  versionEvidenceSource: string | null;
  versionEvidenceDetail: string | null;
}): CheckReport["repoMeta"] {
  return {
    description: raw.description,
    language: raw.language,
    stars: raw.stars,
    forks: raw.forks,
    defaultBranch: raw.defaultBranch ?? "main",
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    license: raw.license,
    version: raw.version,
    versionEvidence: {
      source:
        raw.versionEvidenceSource === "release" ||
        raw.versionEvidenceSource === "tag" ||
        raw.versionEvidenceSource === "manifest" ||
        raw.versionEvidenceSource === "readme" ||
        raw.versionEvidenceSource === "none"
          ? raw.versionEvidenceSource
          : "none",
      detail:
        typeof raw.versionEvidenceDetail === "string"
          ? raw.versionEvidenceDetail
          : "No saved version evidence for this historical record",
    },
  };
}

export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const { owner: rawOwner, repo: rawRepo, analysisId: rawAnalysisId } = await params;
  const owner = decodeURIComponent(rawOwner);
  const repo = decodeURIComponent(rawRepo);
  const analysisId = decodeURIComponent(rawAnalysisId);

  const analysis = await prisma.repoAnalysis.findFirst({
    where: {
      id: analysisId,
      repository: {
        owner,
        name: repo,
      },
    },
    include: {
      repository: true,
    },
  });

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <h2 className="text-2xl font-bold text-cg-blue">Analysis Details</h2>
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Analysis not found for {owner}/{repo}.
        </p>
        <Link
          href={`/history/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
          className="text-cg-lightblue hover:underline text-sm"
        >
          ← Back to repository history
        </Link>
      </div>
    );
  }

  const results = normalizeResults(analysis.results);
  const repoMeta = normalizeRepoMeta(analysis.repository);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <nav className="flex items-center justify-end gap-4 text-sm">
        <Link href="/" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Checker
        </Link>
        <Link href="/history" className="text-cg-lightblue hover:underline font-medium">
          History
        </Link>
        <Link href="/admin" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Admin
        </Link>
        <Link href="/about" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          About
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-cg-blue">Analysis Details</h2>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/history/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
            className="text-cg-lightblue hover:underline"
          >
            Back to repository history
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <p className="text-sm text-gray-800 font-semibold">
          {owner}/{repo}
        </p>
        <p className="text-xs text-gray-500">
          Checked at {new Date(analysis.checkedAt).toLocaleString("nl-NL")}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center text-sm font-bold border rounded-full px-3 py-1 ${badgeClass(
              analysis.score
            )}`}
          >
            Score {analysis.score}
          </span>
          <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200 text-purple-700 bg-purple-50">
            Version: {analysis.version ?? repoMeta.version ?? "unknown"}
          </span>
        </div>
      </section>

      <section className="space-y-1">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
          Criteria results for this run
        </h3>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full border border-blue-300 text-blue-700 bg-blue-50 font-semibold uppercase tracking-wide">
            High confidence
          </span>
          <span className="px-2 py-0.5 rounded-full border border-blue-300 text-blue-700 bg-blue-50/70 font-semibold uppercase tracking-wide">
            Medium confidence
          </span>
          <span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 bg-blue-50/40 font-semibold uppercase tracking-wide">
            Low confidence
          </span>
        </div>
        <p className="mb-2 text-xs text-gray-500">
          Confidence indicates how strong the ownership evidence is: high = explicit legal statement, medium = manifest metadata, low = repository-owner fallback or weak evidence.
        </p>
        {results.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-3">
            No detailed criteria were stored for this analysis.
          </p>
        ) : (
          <div className="space-y-2">
            {CATEGORY_ORDER.map((category) => {
              const sortedResults = results
                .filter((r) => RESULT_CATEGORY_BY_ID[r.id] === category)
                .sort((a, b) => {
                  const indexA = RESULT_ORDER_BY_ID.indexOf(a.id);
                  const indexB = RESULT_ORDER_BY_ID.indexOf(b.id);
                  const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
                  const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
                  return safeIndexA - safeIndexB;
                });

              if (sortedResults.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {sortedResults.map((result, index) => (
                      <ResultCard
                        key={`${result.id}-${index}`}
                        id={result.id}
                        title={result.title}
                        description={result.description}
                        requirementLevel={result.requirementLevel}
                        confidence={result.confidence}
                        status={result.status}
                        message={result.message}
                        evidence={result.evidence}
                        referenceUrl={result.referenceUrl}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
