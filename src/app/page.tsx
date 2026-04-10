"use client";

import { useState } from "react";
import CheckerForm from "@/components/CheckerForm";
import ResultCard from "@/components/ResultCard";
import ScoreBadge from "@/components/ScoreBadge";
import RepoMeta from "@/components/RepoMeta";
import type { CheckReport } from "@/lib/types";
import { AlertCircle, ClipboardList } from "lucide-react";

type CriteriaCategory =
  | "Governance"
  | "Architecture"
  | "Software Quality"
  | "Deployment & Operations";

const CRITERIA_OVERVIEW = [
  {
    icon: "�",
    label: "Source Code",
    category: "Software Quality" as CriteriaCategory,
    desc: "Actual source code files",
    tooltip:
      "The repository must contain real source code (Python, JavaScript, Java, Go, etc.), not just documentation or configuration files. This verifies the repository is a real software project.",
  },
  {
    icon: "�📄",
    label: "OpenAPI / API-first",
    category: "Architecture" as CriteriaCategory,
    desc: "Machine-readable API specification",
    tooltip:
      "An OpenAPI (Swagger) specification must be present so other services can integrate automatically. Checked via openapi.yaml/json or swagger.yaml/json in the repository.",
  },
  {
    icon: "⚖️",
    label: "OSI License",
    category: "Governance" as CriteriaCategory,
    desc: "Open-source license required",
    tooltip:
      "The component must carry an OSI-approved open-source license (e.g. EUPL-1.2, MIT, Apache-2.0). A EUPL license earns bonus points because it is the EU recommended licence for public-sector software.",
  },
  {
    icon: "📋",
    label: "publiccode.yml",
    category: "Governance" as CriteriaCategory,
    desc: "Government reuse metadata file",
    tooltip:
      "A publiccode.yml file in the root of the repository provides standardised metadata (name, description, category, maintenance) used by government software catalogues across Europe.",
  },
  {
    icon: "🐳",
    label: "Docker support",
    category: "Deployment & Operations" as CriteriaCategory,
    desc: "Dockerfile or compose available",
    tooltip:
      "Checks for Docker support in the source repository via Dockerfile and/or docker-compose files.",
  },
  {
    icon: "📦",
    label: "Available Docker image",
    category: "Deployment & Operations" as CriteriaCategory,
    desc: "Published image location",
    tooltip:
      "Checks whether a Docker image location is provided (for example a container registry URL), so deployments can pull a ready-to-run image.",
  },
  {
    icon: "🏛️",
    label: "5-Layer Architecture",
    category: "Architecture" as CriteriaCategory,
    desc: "Adheres to CG layered model",
    tooltip:
      "Common Ground defines a 5-layer model (Interaction, Process, Integration, Services, Data). Repositories should not combine multiple layers in one codebase. Checked by scanning directory names and publiccode.yml categories.",
  },
  {
    icon: "☸️",
    label: "Helm chart (Kubernetes)",
    category: "Deployment & Operations" as CriteriaCategory,
    desc: "K8s-deployable with best practices",
    tooltip:
      "Haven is the Dutch government standard for Kubernetes deployments. Charts must include resource limits, liveness/readiness probes, a security context, and NetworkPolicy manifests.",
  },
  {
    icon: "🧾",
    label: "SBOM",
    category: "Software Quality" as CriteriaCategory,
    desc: "SPDX or CycloneDX inventory file",
    tooltip:
      "A Software Bill of Materials (SBOM) lists every dependency and its version. Common formats are SPDX (.spdx.json) and CycloneDX (.cdx.json / bom.xml). Currently a recommended — not mandatory — check.",
  },
  {
    icon: "📚",
    label: "Documentation",
    category: "Software Quality" as CriteriaCategory,
    desc: "Docs in repo or external docs site",
    tooltip:
      "Documentation should be available for users and integrators. This checker looks for common docs files in the repository and optionally accepts a separate documentation site URL.",
  },
  {
    icon: "🧪",
    label: "Test suite presence",
    category: "Software Quality" as CriteriaCategory,
    desc: "Automated tests detected",
    tooltip:
      "Checks for common test directories, test file naming conventions, or test configuration files.",
  },
  {
    icon: "📉",
    label: "Cyclomatic complexity",
    category: "Software Quality" as CriteriaCategory,
    desc: "Lizard analysis on target repo",
    tooltip:
      "Clones the analyzed repository and runs Lizard locally to measure cyclomatic complexity across supported languages.",
  },
  {
    icon: "🤝",
    label: "Contributing guide",
    category: "Governance" as CriteriaCategory,
    desc: "CONTRIBUTING.md present",
    tooltip:
      "Checks whether a CONTRIBUTING.md-style file exists, so external contributors know how to propose and submit changes.",
  },
  {
    icon: "🛡️",
    label: "Code of Conduct",
    category: "Governance" as CriteriaCategory,
    desc: "CODE_OF_CONDUCT.md present",
    tooltip:
      "Checks whether a Code of Conduct file exists, documenting expected behavior and incident reporting for contributors.",
  },
  {
    icon: "🔒",
    label: "Security policy",
    category: "Governance" as CriteriaCategory,
    desc: "SECURITY.md present",
    tooltip:
      "Checks whether a SECURITY.md file exists, explaining how vulnerabilities should be reported privately and how security handling works.",
  },
  {
    icon: "🔢",
    label: "Semantic Versioning",
    category: "Software Quality" as CriteriaCategory,
    desc: "Version follows semver format",
    tooltip:
      "Checks whether the detected repository version follows semantic versioning (MAJOR.MINOR.PATCH), optionally with prerelease/build metadata.",
  },
];

const CATEGORY_ORDER: CriteriaCategory[] = [
  "Governance",
  "Architecture",
  "Software Quality",
  "Deployment & Operations",
];

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CheckReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(
    url: string,
    helmChartLocations: string[],
    documentationLocations: string[],
    dockerLocations: string[],
    isRegister: boolean
  ) {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: url,
          helmChartLocations,
          documentationLocations,
          dockerLocations,
          isRegister,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "An error occurred.");
      } else {
        setReport(data as CheckReport);
      }
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const passCount =
    report?.results.filter((r) => r.status === "pass").length ?? 0;
  const warnCount =
    report?.results.filter((r) => r.status === "warn").length ?? 0;
  const failCount =
    report?.results.filter((r) => r.status === "fail").length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <nav className="flex items-center justify-end gap-4 text-sm">
        <a href="/" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Checker
        </a>
        <a href="/history" className="text-cg-lightblue hover:underline font-medium">
          History
        </a>
        <a href="/admin" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Admin
        </a>
        <a href="/about" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          About
        </a>
      </nav>

      {/* Hero */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-cg-blue">
          Common Ground Component Checker
        </h2>
        <p className="text-gray-600 max-w-2xl">
          Enter the URL of a public GitHub repository to automatically verify
          whether the component meets Common Ground standards — used by Dutch
          municipalities for open, reusable software.
        </p>
      </section>

      {/* Criteria overview chips */}
      <section>
        <div className="space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const criteria = CRITERIA_OVERVIEW.filter(
              (item) => item.category === category
            );

            return (
              <div
                key={category}
                className="space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50/40"
              >
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {criteria.map((c) => (
                    <div
                      key={c.label}
                      className="relative group/chip h-full min-h-[76px] flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm shadow-sm cursor-default"
                    >
                      <span>{c.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800 leading-tight">
                          {c.label}
                        </p>
                        <p className="text-xs text-gray-400">{c.desc}</p>
                      </div>
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50
                                   w-72 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg
                                   opacity-0 group-hover/chip:opacity-100 transition-opacity duration-150"
                      >
                        {c.tooltip}
                        <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Form */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <CheckerForm onSubmit={handleCheck} loading={loading} />
      </section>

      {/* Loading */}
      {loading && (
        <section className="flex flex-col items-center gap-3 py-12 text-gray-500">
          <div className="spinner w-10 h-10" style={{ width: 40, height: 40 }} />
          <p>Fetching repository and running checks…</p>
        </section>
      )}

      {/* Error */}
      {error && !loading && (
        <section className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl p-5 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </section>
      )}

      {/* Results */}
      {report && !loading && (
        <section className="space-y-6">
          {/* Summary header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <ScoreBadge score={report.score} />
              <div className="flex-1 space-y-3">
                <RepoMeta
                  owner={report.owner}
                  repo={report.repo}
                  repoMeta={report.repoMeta}
                />
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-semibold">
                    ✓ {passCount} passed
                  </span>
                  {warnCount > 0 && (
                    <span className="text-yellow-600 font-semibold">
                      ⚠ {warnCount} warnings
                    </span>
                  )}
                  {failCount > 0 && (
                    <span className="text-red-600 font-semibold">
                      ✗ {failCount} failed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Checked at{" "}
                  {new Date(report.checkedAt).toLocaleString("nl-NL")} —
                  Branch: {report.repoMeta.defaultBranch}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <a
                    href={`/history/${encodeURIComponent(report.owner)}/${encodeURIComponent(report.repo)}`}
                    className="text-cg-lightblue hover:underline"
                  >
                    View repository history
                  </a>
                  <a href="/history" className="text-cg-lightblue hover:underline">
                    Search history
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
              <ClipboardList className="w-4 h-4" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Detailed results — click a row to expand
              </h3>
            </div>
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full border border-green-300 text-green-700 bg-green-50 font-semibold uppercase tracking-wide">
                Pass
              </span>
              <span className="px-2 py-0.5 rounded-full border border-yellow-300 text-yellow-700 bg-yellow-50 font-semibold uppercase tracking-wide">
                Warning
              </span>
              <span className="px-2 py-0.5 rounded-full border border-red-300 text-red-700 bg-red-50 font-semibold uppercase tracking-wide">
                Fail
              </span>
              <span className="px-2 py-0.5 rounded-full border border-gray-800 text-white bg-gray-800 font-semibold uppercase tracking-wide">
                Mandatory
              </span>
              <span className="px-2 py-0.5 rounded-full border border-gray-300 text-gray-600 bg-white font-semibold uppercase tracking-wide">
                Recommended
              </span>
            </div>
            <div className="space-y-2">
              {report.results.map((r) => (
                <ResultCard key={r.id} {...r} />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            Automated analysis only — results are indicative. Some criteria
            (e.g. architecture) require manual review. For official
            certification, contact{" "}
            <a
              href="https://commonground.nl"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              commonground.nl
            </a>
            .
          </p>
        </section>
      )}
    </div>
  );
}
