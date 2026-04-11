import Link from "next/link";
import RepoMeta from "@/components/RepoMeta";
import { prisma } from "@/lib/db";
import type { CheckReport } from "@/lib/types";

interface HistoryPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

function normalizeRepoMeta(raw: unknown): CheckReport["repoMeta"] {
  const fallback: CheckReport["repoMeta"] = {
    description: null,
    language: null,
    stars: 0,
    forks: 0,
    defaultBranch: "main",
    topics: [],
    license: null,
    version: null,
    versionEvidence: {
      source: "none",
      detail: "No saved version evidence for this historical record",
    },
  };

  if (!raw || typeof raw !== "object") return fallback;
  const meta = raw as Partial<CheckReport["repoMeta"]>;

  return {
    description: typeof meta.description === "string" ? meta.description : null,
    language: typeof meta.language === "string" ? meta.language : null,
    stars: typeof meta.stars === "number" ? meta.stars : 0,
    forks: typeof meta.forks === "number" ? meta.forks : 0,
    defaultBranch:
      typeof meta.defaultBranch === "string" ? meta.defaultBranch : "main",
    topics: Array.isArray(meta.topics)
      ? meta.topics.filter((v): v is string => typeof v === "string")
      : [],
    license: typeof meta.license === "string" ? meta.license : null,
    version: typeof meta.version === "string" ? meta.version : null,
    versionEvidence:
      meta.versionEvidence && typeof meta.versionEvidence === "object"
        ? {
            source:
              meta.versionEvidence.source === "release" ||
              meta.versionEvidence.source === "tag" ||
              meta.versionEvidence.source === "manifest" ||
              meta.versionEvidence.source === "readme" ||
              meta.versionEvidence.source === "none"
                ? meta.versionEvidence.source
                : "none",
            detail:
              typeof meta.versionEvidence.detail === "string"
                ? meta.versionEvidence.detail
                : "No saved version evidence for this historical record",
          }
        : {
            source: "none",
            detail: "No saved version evidence for this historical record",
          },
  };
}

function summarizeStatuses(results: unknown): {
  pass: number;
  warn: number;
  fail: number;
  info: number;
  total: number;
} {
  if (!Array.isArray(results)) {
    return { pass: 0, warn: 0, fail: 0, info: 0, total: 0 };
  }

  let pass = 0;
  let warn = 0;
  let fail = 0;
  let info = 0;

  for (const item of results) {
    const status =
      item && typeof item === "object" && "status" in item
        ? (item as { status?: unknown }).status
        : undefined;

    if (status === "pass") pass += 1;
    else if (status === "warn") warn += 1;
    else if (status === "fail") fail += 1;
    else if (status === "info") info += 1;
  }

  const total = pass + warn + fail + info;
  return { pass, warn, fail, info, total };
}

function badgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default async function RepoHistoryPage({ params }: HistoryPageProps) {
  const { owner: rawOwner, repo: rawRepo } = await params;
  const owner = decodeURIComponent(rawOwner);
  const repo = decodeURIComponent(rawRepo);

  const repository = await prisma.repo.findFirst({
    where: { owner, name: repo },
    include: {
      analyses: {
        orderBy: { checkedAt: "desc" },
      },
    },
  });

  if (!repository) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <h2 className="text-2xl font-bold text-cg-blue">Repository History</h2>
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          No saved analyses found for {owner}/{repo}.
        </p>
        <Link href="/history" className="text-cg-lightblue hover:underline text-sm">
          ← Back to history search
        </Link>
      </div>
    );
  }

  const repoMeta = normalizeRepoMeta(repository.metadata);

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
        <h2 className="text-2xl font-bold text-cg-blue">Repository History</h2>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/history" className="text-cg-lightblue hover:underline">
            Search another repository
          </Link>
          <Link href="/" className="text-cg-lightblue hover:underline">
            Run new check
          </Link>
        </div>
      </div>

      <RepoMeta owner={repository.owner} repo={repository.name} repoMeta={repoMeta} />

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-800">Historical analyses</h3>
          <span className="text-sm text-gray-500">
            {repository.analyses.length} run{repository.analyses.length === 1 ? "" : "s"}
          </span>
        </div>

        {repository.analyses.length === 0 ? (
          <p className="text-sm text-gray-500">No analyses stored yet.</p>
        ) : (
          <div className="space-y-3">
            {repository.analyses.map((analysis) => {
              const stats = summarizeStatuses(analysis.results);
              return (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(analysis.checkedAt).toLocaleString("nl-NL")}
                    </p>
                    <p className="text-xs text-gray-500">
                      pass {stats.pass} • warn {stats.warn} • fail {stats.fail}
                      {stats.info > 0 ? ` • info ${stats.info}` : ""}
                      {stats.total > 0 ? ` • total ${stats.total}` : ""}
                    </p>
                    <p className="text-xs text-purple-700">
                      Version: {analysis.version ?? "unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center text-sm font-bold border rounded-full px-3 py-1 ${badgeClass(
                        analysis.score
                      )}`}
                    >
                      Score {analysis.score}
                    </span>
                    <Link
                      href={`/history/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${encodeURIComponent(analysis.id)}`}
                      className="text-sm text-cg-lightblue hover:underline"
                    >
                      View details
                    </Link>
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
