import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HistoryHomePage() {
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
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {repositories.length === 0 ? (
          <p className="text-sm text-gray-500">No repositories analyzed yet.</p>
        ) : (
          <div className="space-y-3">
            {repositories.map((repository) => {
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
