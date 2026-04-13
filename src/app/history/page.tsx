import Link from "next/link";
import { prisma } from "@/lib/db";

type SortKey = "date" | "score";
type SortDirection = "asc" | "desc";

interface HistoryHomePageProps {
  searchParams: Promise<{
    sort?: string | string[];
    direction?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeSortKey(value: string | undefined): SortKey {
  return value === "score" ? "score" : "date";
}

function normalizeSortDirection(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function sortRepositories<T extends { analyses: Array<{ checkedAt: Date; score: number }> }>(
  repositories: T[],
  sortKey: SortKey,
  sortDirection: SortDirection
): T[] {
  const sorted = [...repositories];
  const directionMultiplier = sortDirection === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    const latestA = a.analyses[0] ?? null;
    const latestB = b.analyses[0] ?? null;

    if (!latestA && !latestB) return 0;
    if (!latestA) return 1;
    if (!latestB) return -1;

    const valueA =
      sortKey === "date" ? latestA.checkedAt.getTime() : latestA.score;
    const valueB =
      sortKey === "date" ? latestB.checkedAt.getTime() : latestB.score;

    if (valueA === valueB) return 0;
    return valueA > valueB ? directionMultiplier : -directionMultiplier;
  });

  return sorted;
}

export default async function HistoryHomePage({ searchParams }: HistoryHomePageProps) {
  const query = await searchParams;
  const sortKey = normalizeSortKey(firstValue(query.sort));
  const sortDirection = normalizeSortDirection(firstValue(query.direction));

  const repositories = await prisma.repo.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      analyses: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
      _count: {
        select: { analyses: true },
      },
    },
  });

  const sortedRepositories = sortRepositories(repositories, sortKey, sortDirection);

  const sortOptions: Array<{ label: string; sort: SortKey; direction: SortDirection }> = [
    { label: "Date ↑", sort: "date", direction: "asc" },
    { label: "Date ↓", sort: "date", direction: "desc" },
    { label: "Score ↑", sort: "score", direction: "asc" },
    { label: "Score ↓", sort: "score", direction: "desc" },
  ];

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

      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-cg-blue">Analyzed Repositories</h2>
        <p className="text-gray-600">
          Select a repository to view metadata and historical analyses over time.
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-gray-500">Sort by:</span>
          {sortOptions.map((option) => {
            const isActive = option.sort === sortKey && option.direction === sortDirection;
            return (
              <Link
                key={`${option.sort}-${option.direction}`}
                href={`/history?sort=${option.sort}&direction=${option.direction}`}
                className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  isActive
                    ? "border-cg-lightblue text-cg-blue bg-cg-lightblue/10"
                    : "border-gray-300 text-gray-600 bg-white hover:border-cg-lightblue hover:text-cg-blue"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {sortedRepositories.length === 0 ? (
          <p className="text-sm text-gray-500">No repositories analyzed yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedRepositories.map((repository) => {
              const latest = repository.analyses[0] ?? null;

              return (
                <Link
                  key={repository.id}
                  href={`/history/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
                  className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-cg-lightblue hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {repository.owner}/{repository.name}
                      </p>
                      <p className="text-xs text-gray-500">{repository.repoUrl}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{repository._count.analyses} analyses</p>
                      {latest && (
                        <p>
                          Last: {new Date(latest.checkedAt).toLocaleString("nl-NL")}
                        </p>
                      )}
                    </div>
                  </div>
                  {latest && (
                    <div className="mt-2">
                      <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 text-gray-700 bg-white">
                        Latest score: {latest.score}
                      </span>
                      <span className="inline-flex ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200 text-purple-700 bg-purple-50">
                        Version: {latest.version ?? "unknown"}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
