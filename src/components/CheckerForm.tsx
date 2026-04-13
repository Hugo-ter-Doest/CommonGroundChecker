"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface CheckerFormProps {
  onSubmit: (
    url: string,
    helmChartLocations: string[],
    documentationLocations: string[],
    dockerLocations: string[],
    apiSpecificationLocations: string[],
    isRegister: boolean
  ) => void;
  loading: boolean;
}

interface RecentRepository {
  id: string;
  owner: string;
  name: string;
  repoUrl: string;
  helmChartLocations?: string[];
  dockerLocations?: string[];
  apiSpecificationLocations?: string[];
  documentationLocations?: string[];
  analysisCount: number;
  latestAnalysis: {
    checkedAt: string;
    score: number;
  } | null;
}

type StoredCheckResult = {
  id?: string;
  evidence?: string[];
};

function normalizeLocations(values?: string[]): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => value.trim()).filter(Boolean);
}

function extractFromEvidenceByCheckId(
  results: StoredCheckResult[] | undefined,
  checkId: string
): string[] {
  if (!Array.isArray(results)) return [];
  const hit = results.find((item) => item.id === checkId);
  const evidence = Array.isArray(hit?.evidence) ? hit.evidence : [];
  return evidence.map((value) => value.trim()).filter(Boolean);
}

function parseHelmLocationsFromEvidence(results: StoredCheckResult[] | undefined): string[] {
  const helmEvidence = extractFromEvidenceByCheckId(results, "helmchart");
  const providedLine = helmEvidence.find((line) =>
    line.toLowerCase().startsWith("provided helm locations:")
  );

  if (providedLine) {
    return providedLine
      .split(":")
      .slice(1)
      .join(":")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const externalHelm = helmEvidence.filter((line) => line.startsWith("http"));
  return externalHelm;
}

function parseDocumentationLocationsFromEvidence(
  results: StoredCheckResult[] | undefined
): string[] {
  const docEvidence = extractFromEvidenceByCheckId(results, "documentation");
  return docEvidence.filter((value) => /^https?:\/\//i.test(value));
}

function parseApiSpecificationLocationsFromEvidence(
  results: StoredCheckResult[] | undefined
): string[] {
  const apiEvidence = extractFromEvidenceByCheckId(results, "openapi");

  return apiEvidence
    .map((value) => {
      const prefix = "API specification was auto-discovered by the checker:";
      if (value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
      }
      return value;
    })
    .map((value) => value.trim())
    .filter((value) => {
      if (!value) return false;
      if (/^https?:\/\//i.test(value)) return true;
      return !value.includes("://") && !value.includes(" ");
    });
}

async function fetchLatestLocationsFromHistory(
  owner: string,
  repo: string
): Promise<{
  helmChartLocations: string[];
  dockerLocations: string[];
  apiSpecificationLocations: string[];
  documentationLocations: string[];
}> {
  try {
    const response = await fetch(
      `/api/repo-history?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&limit=1`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      return {
        helmChartLocations: [],
        dockerLocations: [],
        apiSpecificationLocations: [],
        documentationLocations: [],
      };
    }

    const data = (await response.json()) as {
      analyses?: Array<{ results?: StoredCheckResult[] }>;
    };

    const latestResults = data.analyses?.[0]?.results;

    return {
      helmChartLocations: parseHelmLocationsFromEvidence(latestResults),
      dockerLocations: extractFromEvidenceByCheckId(latestResults, "dockerimage"),
      apiSpecificationLocations: parseApiSpecificationLocationsFromEvidence(
        latestResults
      ),
      documentationLocations: parseDocumentationLocationsFromEvidence(latestResults),
    };
  } catch {
    return {
      helmChartLocations: [],
      dockerLocations: [],
      apiSpecificationLocations: [],
      documentationLocations: [],
    };
  }
}

const EXAMPLE_REPOS = [
  "https://github.com/open-zaak/open-zaak",
  "https://github.com/maykinmedia/objects-api",
  "https://github.com/open-formulieren/open-forms",
];

export default function CheckerForm({ onSubmit, loading }: CheckerFormProps) {
  const [value, setValue] = useState("");
  const [recentRepositories, setRecentRepositories] = useState<RecentRepository[]>([]);
  const [helmSomewhereElse, setHelmSomewhereElse] = useState(false);
  const [helmChartUrl, setHelmChartUrl] = useState("");
  const [documentationSomewhereElse, setDocumentationSomewhereElse] =
    useState(false);
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [dockerSomewhereElse, setDockerSomewhereElse] = useState(false);
  const [dockerUrl, setDockerUrl] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [apiSpecificationSomewhereElse, setApiSpecificationSomewhereElse] =
    useState(false);
  const [apiSpecificationUrl, setApiSpecificationUrl] = useState("");

  async function applyRepositoryPrefill(repository: RecentRepository) {
    let helmChartLocations = normalizeLocations(repository.helmChartLocations);
    let documentationLocations = normalizeLocations(repository.documentationLocations);
    let dockerLocations = normalizeLocations(repository.dockerLocations);
    let apiSpecificationLocations = normalizeLocations(repository.apiSpecificationLocations);

    const needsFallback =
      helmChartLocations.length === 0 &&
      documentationLocations.length === 0 &&
      dockerLocations.length === 0 &&
      apiSpecificationLocations.length === 0;

    if (needsFallback) {
      const fallback = await fetchLatestLocationsFromHistory(
        repository.owner,
        repository.name
      );
      helmChartLocations = fallback.helmChartLocations;
      documentationLocations = fallback.documentationLocations;
      dockerLocations = fallback.dockerLocations;
      apiSpecificationLocations = fallback.apiSpecificationLocations;
    }

    const helmLocation = helmChartLocations[0] ?? "";
    const documentationLocation = documentationLocations[0] ?? "";
    const dockerLocation = dockerLocations[0] ?? "";
    const apiSpecificationLocation = apiSpecificationLocations[0] ?? "";

    setValue(repository.repoUrl);

    setHelmSomewhereElse(Boolean(helmLocation));
    setHelmChartUrl(helmLocation);

    setDocumentationSomewhereElse(Boolean(documentationLocation));
    setDocumentationUrl(documentationLocation);

    setDockerSomewhereElse(Boolean(dockerLocation));
    setDockerUrl(dockerLocation);

    const hasApiSpecificationLocation = Boolean(apiSpecificationLocation);
    setIsRegister(hasApiSpecificationLocation);
    setApiSpecificationSomewhereElse(hasApiSpecificationLocation);
    setApiSpecificationUrl(apiSpecificationLocation);
  }

  async function handleExampleSelect(url: string) {
    const fromHistory = recentRepositories.find(
      (repository) => repository.repoUrl === url
    );

    if (fromHistory) {
      await applyRepositoryPrefill(fromHistory);
      return;
    }

    setValue(url);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRecentRepositories() {
      try {
        const response = await fetch("/api/repositories?limit=8", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as {
          repositories?: RecentRepository[];
        };

        if (!cancelled && Array.isArray(data.repositories)) {
          setRecentRepositories(data.repositories);
        }
      } catch {
        // Ignore and keep the static examples only.
      }
    }

    void loadRecentRepositories();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    if (helmSomewhereElse && !helmChartUrl.trim()) return;
    if (documentationSomewhereElse && !documentationUrl.trim()) return;
    if (dockerSomewhereElse && !dockerUrl.trim()) return;
    if (isRegister && apiSpecificationSomewhereElse && !apiSpecificationUrl.trim()) return;

    const parsedHelmLocations = helmSomewhereElse && helmChartUrl.trim()
      ? [helmChartUrl.trim()]
      : [];
    const parsedDocumentationLocations =
      documentationSomewhereElse && documentationUrl.trim()
        ? [documentationUrl.trim()]
        : [];
    const parsedDockerLocations = dockerSomewhereElse && dockerUrl.trim()
      ? [dockerUrl.trim()]
      : [];
    const parsedApiSpecificationLocations =
      isRegister && apiSpecificationSomewhereElse && apiSpecificationUrl.trim()
        ? [apiSpecificationUrl.trim()]
        : [];

    onSubmit(
      value.trim(),
      parsedHelmLocations,
      parsedDocumentationLocations,
      parsedDockerLocations,
      parsedApiSpecificationLocations,
      isRegister
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://github.com/organisation/repository"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
            disabled={loading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={
            loading ||
            !value.trim() ||
            (helmSomewhereElse && !helmChartUrl.trim()) ||
            (documentationSomewhereElse && !documentationUrl.trim()) ||
            (dockerSomewhereElse && !dockerUrl.trim()) ||
            (isRegister && apiSpecificationSomewhereElse && !apiSpecificationUrl.trim())
          }
          className="px-6 py-3 bg-cg-blue text-white font-semibold rounded-lg hover:bg-cg-lightblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Checking…
            </>
          ) : (
            "Analyze component"
          )}
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isRegister}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsRegister(checked);
              if (!checked) {
                setApiSpecificationSomewhereElse(false);
                setApiSpecificationUrl("");
              }
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Component is a register
        </label>

        {isRegister && (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={apiSpecificationSomewhereElse}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setApiSpecificationSomewhereElse(checked);
                  if (!checked) setApiSpecificationUrl("");
                }}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
              />
              API specification is somewhere else
            </label>

            {apiSpecificationSomewhereElse && (
              <div>
                <label htmlFor="api-specification-url" className="block text-xs text-gray-500 mb-1">
                  URL or repository path to API specification
                </label>
                <input
                  id="api-specification-url"
                  type="text"
                  value={apiSpecificationUrl}
                  onChange={(e) => setApiSpecificationUrl(e.target.value)}
                  placeholder="https://example.com/openapi.yaml or api/openapi.yaml"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
                  disabled={loading}
                  required={isRegister && apiSpecificationSomewhereElse}
                />
              </div>
            )}
          </>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={helmSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setHelmSomewhereElse(checked);
              if (!checked) setHelmChartUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Helm chart is somewhere else
        </label>

        {helmSomewhereElse && (
          <div>
            <label htmlFor="helm-chart-url" className="block text-xs text-gray-500 mb-1">
              URL to the Helm chart
            </label>
            <input
              id="helm-chart-url"
              type="url"
              value={helmChartUrl}
              onChange={(e) => setHelmChartUrl(e.target.value)}
              placeholder="https://github.com/org/charts/tree/main/charts/mychart"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={helmSomewhereElse}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={documentationSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setDocumentationSomewhereElse(checked);
              if (!checked) setDocumentationUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Documentation is on a separate site
        </label>

        {documentationSomewhereElse && (
          <div>
            <label
              htmlFor="documentation-url"
              className="block text-xs text-gray-500 mb-1"
            >
              URL to documentation site
            </label>
            <input
              id="documentation-url"
              type="url"
              value={documentationUrl}
              onChange={(e) => setDocumentationUrl(e.target.value)}
              placeholder="https://docs.example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={documentationSomewhereElse}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={dockerSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setDockerSomewhereElse(checked);
              if (!checked) setDockerUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Docker image available
        </label>

        {dockerSomewhereElse && (
          <div>
            <label htmlFor="docker-url" className="block text-xs text-gray-500 mb-1">
              URL to Docker image
            </label>
            <input
              id="docker-url"
              type="url"
              value={dockerUrl}
              onChange={(e) => setDockerUrl(e.target.value)}
              placeholder="https://ghcr.io/your-org/your-image"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={dockerSomewhereElse}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400">Try an example:</span>
        {EXAMPLE_REPOS.map((url) => {
          const name = url.replace("https://github.com/", "");
          return (
            <button
              key={url}
              type="button"
              onClick={() => {
                void handleExampleSelect(url);
              }}
              disabled={loading}
              className="text-xs text-cg-lightblue hover:underline disabled:opacity-50"
            >
              {name}
            </button>
          );
        })}
      </div>

      {recentRepositories.length > 0 && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-800">Recently analyzed repositories</p>
              <p className="text-xs text-gray-500">
                Pick a repository from history to prefill the checker.
              </p>
            </div>
            <Link
              href="/history"
              className="text-xs font-medium text-cg-lightblue hover:underline"
            >
              View full history
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentRepositories.map((repository) => (
              <button
                key={repository.id}
                type="button"
                onClick={() => {
                  void applyRepositoryPrefill(repository);
                }}
                disabled={loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left transition-colors hover:border-cg-lightblue hover:bg-cg-lightblue/5 disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {repository.owner}/{repository.name}
                </p>
                <p className="truncate text-xs text-gray-500">{repository.repoUrl}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                  <span>{repository.analysisCount} analys{repository.analysisCount === 1 ? "is" : "es"}</span>
                  {repository.latestAnalysis && (
                    <span>Latest score: {repository.latestAnalysis.score}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
