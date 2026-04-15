"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CheckerForm from "@/components/CheckerForm";
import ResultCard from "@/components/ResultCard";
import ScoreBadge from "@/components/ScoreBadge";
import RepoMeta from "@/components/RepoMeta";
import type { CheckReport } from "@/lib/types";
import { AlertCircle, ClipboardList } from "lucide-react";

function sanitizePdfFileName(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

async function exportAnalysisReportAsPdf(report: CheckReport): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensurePageSpace = (required = 20) => {
    if (y + required <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const addBlock = (text: string, options?: { size?: number; indent?: number; gapAfter?: number }) => {
    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    const gapAfter = options?.gapAfter ?? 8;
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = size + 2;

    for (const line of lines) {
      ensurePageSpace(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }

    y += gapAfter;
  };

  doc.setFont("helvetica", "bold");
  addBlock("Common Ground Component Checker — Analysis Report", {
    size: 16,
    gapAfter: 10,
  });

  doc.setFont("helvetica", "normal");
  addBlock(`Repository: ${report.owner}/${report.repo}`, { size: 11, gapAfter: 4 });
  addBlock(`URL: ${report.repoUrl}`, { size: 10, gapAfter: 4 });
  addBlock(`Checked at: ${new Date(report.checkedAt).toLocaleString("nl-NL")}`, {
    size: 10,
    gapAfter: 4,
  });
  addBlock(`Score: ${report.score}/100`, { size: 11, gapAfter: 10 });

  const passCount = report.results.filter((r) => r.status === "pass").length;
  const warnCount = report.results.filter((r) => r.status === "warn").length;
  const failCount = report.results.filter((r) => r.status === "fail").length;
  const infoCount = report.results.filter((r) => r.status === "info").length;

  addBlock(
    `Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed, ${infoCount} informational`,
    { size: 10, gapAfter: 12 }
  );

  doc.setFont("helvetica", "bold");
  addBlock("Detailed results", { size: 12, gapAfter: 8 });
  doc.setFont("helvetica", "normal");

  for (const result of report.results) {
    ensurePageSpace(40);
    doc.setFont("helvetica", "bold");
    addBlock(
      `${result.title} [${result.status.toUpperCase()}] — ${(result.requirementLevel ?? "recommended").toUpperCase()}`,
      { size: 10, gapAfter: 2 }
    );

    doc.setFont("helvetica", "normal");
    addBlock(`Message: ${result.message}`, { size: 10, indent: 10, gapAfter: 2 });

    if (result.evidence && result.evidence.length > 0) {
      addBlock("Evidence:", { size: 9, indent: 10, gapAfter: 2 });
      for (const evidenceItem of result.evidence.slice(0, 6)) {
        addBlock(`- ${evidenceItem}`, { size: 9, indent: 20, gapAfter: 1 });
      }
      y += 3;
    } else {
      y += 4;
    }
  }

  const checkedDate = new Date(report.checkedAt).toISOString().slice(0, 10);
  const fileName = `${sanitizePdfFileName(report.owner)}-${sanitizePdfFileName(report.repo)}-analysis-${checkedDate}.pdf`;
  doc.save(fileName);
}

type CriteriaCategory =
  | "Governance"
  | "Security"
  | "Architecture"
  | "Software Quality"
  | "Deployment & Operations";

type RequirementLevelLabel = "mandatory" | "recommended" | "informative";

const DEFAULT_REQUIREMENT_LEVEL_BY_CHECK_ID: Record<string, RequirementLevelLabel> = {
  sourcecode: "mandatory",
  fivelayer: "mandatory",
  license: "mandatory",
  eupllicense: "recommended",
  copyrightowner: "mandatory",
  publiccode: "mandatory",
  docker: "mandatory",
  dockerimage: "mandatory",
  openapi: "mandatory",
  adrvalidator: "mandatory",
  helmchart: "mandatory",
  sbom: "recommended",
  documentation: "mandatory",
  tests: "mandatory",
  complexity: "recommended",
  codemetrics: "informative",
  owaspsecurecoding: "recommended",
  contributing: "recommended",
  codeofconduct: "recommended",
  security: "recommended",
  semver: "recommended",
};

const CHECK_ID_BY_CRITERION_LABEL: Record<string, string> = {
  "Source Code": "sourcecode",
  "5-Layer Architecture": "fivelayer",
  "OSI License": "license",
  "EUPL License": "eupllicense",
  "Copyright / IP owner": "copyrightowner",
  "publiccode.yml": "publiccode",
  "Docker support": "docker",
  "Available Docker image": "dockerimage",
  "OpenAPI / API-first": "openapi",
  "NL API Design Rules": "adrvalidator",
  "Helm chart (Kubernetes)": "helmchart",
  SBOM: "sbom",
  Documentation: "documentation",
  "Test suite presence": "tests",
  "Cyclomatic complexity": "complexity",
  "Code Metrics": "codemetrics",
  "OWASP Secure Coding": "owaspsecurecoding",
  "Contributing guide": "contributing",
  "Code of Conduct": "codeofconduct",
  "Security policy": "security",
  "Semantic Versioning": "semver",
};

function formatRequirementLabel(level: RequirementLevelLabel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function getRequirementBadgeClass(level: RequirementLevelLabel): string {
  switch (level) {
    case "mandatory":
      return "border-red-300 text-red-700 bg-red-50";
    case "recommended":
      return "border-amber-300 text-amber-700 bg-amber-50";
    case "informative":
    default:
      return "border-blue-300 text-blue-700 bg-blue-50";
  }
}

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
    icon: "🏛️",
    label: "5-Layer Architecture",
    category: "Architecture" as CriteriaCategory,
    desc: "Adheres to CG layered model",
    tooltip:
      "Common Ground defines a 5-layer model (Interaction, Process, Integration, Services, Data). Repositories should not combine multiple layers in one codebase. Checked by scanning directory names and publiccode.yml categories.",
  },
  {
    icon: "⚖️",
    label: "OSI License",
    category: "Governance" as CriteriaCategory,
    desc: "Open-source license required",
    tooltip:
      "The component must carry an OSI-approved open-source license (e.g. EUPL-1.2, MIT, Apache-2.0).",
  },
  {
    icon: "🇪🇺",
    label: "EUPL License",
    category: "Governance" as CriteriaCategory,
    desc: "Explicit EUPL preference check",
    tooltip:
      "Checks explicitly whether the repository uses the European Union Public Licence (EUPL), which is recommended for public-sector software reuse in Europe.",
  },
  {
    icon: "©",
    label: "Copyright / IP owner",
    category: "Governance" as CriteriaCategory,
    desc: "Probable ownership disclosure",
    tooltip:
      "Detects probable copyright holder(s) from COPYRIGHT/NOTICE/LICENSE/README files and package metadata. If no explicit statement is found, it falls back to repository ownership metadata with lower confidence.",
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
    icon: "📄",
    label: "OpenAPI / API-first",
    category: "Architecture" as CriteriaCategory,
    desc: "Machine-readable API specification",
    tooltip:
      "An OpenAPI (Swagger) specification must be present so other services can integrate automatically. Checked via openapi.yaml/json or swagger.yaml/json in the repository.",
  },
  {
    icon: "🇳🇱",
    label: "NL API Design Rules",
    category: "Architecture" as CriteriaCategory,
    desc: "Conformance to Dutch government standards",
    tooltip:
      "API specifications must comply with the Common Ground API Design Rules (ADR), the Dutch government's standard for API design. Rules cover naming conventions, security, versioning, and more.",
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
    icon: "📊",
    label: "Code Metrics",
    category: "Software Quality" as CriteriaCategory,
    desc: "Lines of code and function count",
    tooltip:
      "Provides additional software quality metrics as supporting information: total lines of code (NLOC) and function count. This criterion is informative only and does not affect the overall score.",
  },
  {
    icon: "🛡️",
    label: "OWASP Secure Coding",
    category: "Security" as CriteriaCategory,
    desc: "Heuristic secure code scan",
    tooltip:
      "Performs a heuristic static scan for common risky coding patterns aligned with OWASP secure coding concerns, such as eval usage, weak hashes, disabled TLS verification, or hardcoded secrets.",
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
    category: "Security" as CriteriaCategory,
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
  "Security",
  "Architecture",
  "Software Quality",
  "Deployment & Operations",
];

const RESULT_ORDER_BY_ID: string[] = [
  "sourcecode",
  "fivelayer",
  "license",
  "eupllicense",
  "copyrightowner",
  "publiccode",
  "docker",
  "dockerimage",
  "openapi",
  "adrvalidator",
  "helmchart",
  "sbom",
  "documentation",
  "tests",
  "complexity",
  "codemetrics",
  "owaspsecurecoding",
  "contributing",
  "codeofconduct",
  "security",
  "semver",
];

const RESULT_CATEGORY_BY_ID: Record<string, CriteriaCategory> = {
  sourcecode: "Software Quality",
  openapi: "Architecture",
  adrvalidator: "Architecture",
  license: "Governance",
  eupllicense: "Governance",
  copyrightowner: "Governance",
  publiccode: "Governance",
  docker: "Deployment & Operations",
  dockerimage: "Deployment & Operations",
  helmchart: "Deployment & Operations",
  sbom: "Software Quality",
  documentation: "Software Quality",
  tests: "Software Quality",
  complexity: "Software Quality",
  codemetrics: "Software Quality",
  owaspsecurecoding: "Security",
  contributing: "Governance",
  codeofconduct: "Governance",
  security: "Security",
  semver: "Software Quality",
  fivelayer: "Architecture",
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [report, setReport] = useState<CheckReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requirementLevelsByCheckId, setRequirementLevelsByCheckId] = useState<
    Record<string, RequirementLevelLabel>
  >(DEFAULT_REQUIREMENT_LEVEL_BY_CHECK_ID);
  const [progress, setProgress] = useState<{ step: string; pct: number }>({
    step: "",
    pct: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadRequirementLevels() {
      try {
        const response = await fetch("/api/admin/scoring", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          criterionRequirementLevels?: Record<string, RequirementLevelLabel>;
        };

        if (cancelled || !data.criterionRequirementLevels) return;

        setRequirementLevelsByCheckId({
          ...DEFAULT_REQUIREMENT_LEVEL_BY_CHECK_ID,
          ...data.criterionRequirementLevels,
        });
      } catch {
        // Ignore failures and keep default requirement levels.
      }
    }

    void loadRequirementLevels();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCheck(
    url: string,
    helmChartLocations: string[],
    documentationLocations: string[],
    dockerLocations: string[],
    apiSpecificationLocations: string[],
    isRegister: boolean
  ) {
    setLoading(true);
    setError(null);
    setReport(null);
    setProgress({ step: "Starting analysis…", pct: 0 });

    try {
      const res = await fetch("/api/check/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: url,
          helmChartLocations,
          documentationLocations,
          dockerLocations,
          apiSpecificationLocations,
          isRegister,
        }),
      });

      if (!res.body) throw new Error("No response stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.slice(6)) as {
            step: string;
            pct: number;
            done?: boolean;
            result?: CheckReport;
            error?: string;
          };

          if (payload.error) {
            setError(payload.error);
            setLoading(false);
            return;
          }

          setProgress({ step: payload.step, pct: payload.pct });

          if (payload.done && payload.result) {
            setReport(payload.result);
            setLoading(false);
            return;
          }
        }
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
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((category) => {
            const criteria = CRITERIA_OVERVIEW.filter(
              (item) => item.category === category
            );

            return (
              <div
                key={category}
                className="space-y-2 border border-gray-200 rounded-xl p-2.5 bg-gray-50/40 flex-1 min-w-[240px]"
              >
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-3 max-h-[460px] overflow-y-auto overflow-x-hidden pr-1">
                  {criteria.map((c) => {
                    const checkId = CHECK_ID_BY_CRITERION_LABEL[c.label];
                    const requirementLevel =
                      requirementLevelsByCheckId[checkId] ?? "informative";

                    return (
                      <div
                        key={c.label}
                        className="relative group/chip min-h-[64px] flex items-start justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm cursor-default"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="mt-0.5 shrink-0 text-sm">{c.icon}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 leading-tight text-sm">
                              {c.label}
                            </p>
                            <p className="text-[11px] text-gray-400 leading-snug">{c.desc}</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wide ${getRequirementBadgeClass(requirementLevel)}`}
                          >
                            {formatRequirementLabel(requirementLevel)}
                          </span>
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
                    );
                  })}
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

      {/* Progress bar */}
      {loading && (
        <section className="py-10">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{progress.step}</span>
              <span className="text-cg-blue font-semibold tabular-nums">
                {progress.pct}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-cg-lightblue transition-all duration-500 ease-out"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Analysing repository — this may take a moment for complexity analysis…
            </p>
          </div>
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
                  <Link
                    href={`/history/${encodeURIComponent(report.owner)}/${encodeURIComponent(report.repo)}`}
                    className="text-cg-lightblue hover:underline"
                  >
                    View repository history
                  </Link>
                  <Link href="/history" className="text-cg-lightblue hover:underline">
                    Search history
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setExportingPdf(true);
                      try {
                        await exportAnalysisReportAsPdf(report);
                      } finally {
                        setExportingPdf(false);
                      }
                    }}
                    disabled={exportingPdf}
                    className="text-cg-lightblue hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingPdf ? "Exporting PDF…" : "Export analysis as PDF"}
                  </button>
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
              <span className="px-2 py-0.5 rounded-full border border-red-300 text-red-700 bg-red-50 font-semibold uppercase tracking-wide">
                Mandatory
              </span>
              <span className="px-2 py-0.5 rounded-full border border-amber-300 text-amber-700 bg-amber-50 font-semibold uppercase tracking-wide">
                Recommended
              </span>
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
            <p className="mb-3 text-xs text-gray-500">
              Confidence indicates how strong the ownership evidence is: high = explicit legal statement, medium = manifest metadata, low = repository-owner fallback or weak evidence.
            </p>
            <div className="space-y-2">
              {CATEGORY_ORDER.map((category) => {
                const sortedResults = report.results
                  .filter((r) => RESULT_CATEGORY_BY_ID[r.id] === category)
                  .sort((a, b) => {
                    const indexA = RESULT_ORDER_BY_ID.indexOf(a.id);
                    const indexB = RESULT_ORDER_BY_ID.indexOf(b.id);
                    const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
                    const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
                    return safeIndexA - safeIndexB;
                  });

                return sortedResults.length > 0 ? (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {sortedResults.map((r) => (
                        <ResultCard key={r.id} {...r} />
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
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
