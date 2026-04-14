"use client";

import { useMemo, useState } from "react";

interface CriterionField {
  id: string;
  label: string;
  explanation: string;
  requirementLevel?: "mandatory" | "recommended" | "informative";
}

interface CriterionCategory {
  category: string;
  criteria: CriterionField[];
}

const CRITERION_CATEGORIES: CriterionCategory[] = [
  {
    category: "Governance",
    criteria: [
      {
        id: "license",
        label: "OSI license",
        explanation:
          "The component must carry an OSI-approved open-source license (e.g. EUPL-1.2, MIT, Apache-2.0).",
      },
      {
        id: "eupllicense",
        label: "EUPL license",
        explanation:
          "Checks explicitly whether the repository uses the European Union Public Licence (EUPL), which is recommended for public-sector software reuse in Europe.",
      },
      {
        id: "copyrightowner",
        label: "Copyright / IP owner",
        explanation:
          "Detects probable copyright holder(s) from COPYRIGHT/NOTICE/LICENSE/README files and package metadata. If no explicit statement is found, it falls back to repository ownership metadata with a warning.",
      },
      {
        id: "publiccode",
        label: "publiccode.yml",
        explanation:
          "A publiccode.yml file in the root of the repository provides standardised metadata (name, description, category, maintenance) used by government software catalogues across Europe.",
      },
      {
        id: "contributing",
        label: "Contributing guide",
        explanation:
          "Checks whether a CONTRIBUTING.md-style file exists, so external contributors know how to propose and submit changes.",
      },
      {
        id: "codeofconduct",
        label: "Code of Conduct",
        explanation:
          "Checks whether a Code of Conduct file exists, documenting expected behavior and incident reporting for contributors.",
      },
      {
        id: "security",
        label: "Security policy",
        explanation:
          "Checks whether a SECURITY.md file exists, explaining how vulnerabilities should be reported privately and how security handling works.",
      },
    ],
  },
  {
    category: "Architecture",
    criteria: [
      {
        id: "fivelayer",
        label: "5-layer architecture",
        explanation:
          "Common Ground defines a 5-layer model (Interaction, Process, Integration, Services, Data). Repositories should not combine multiple layers in one codebase. Checked by scanning directory names and publiccode.yml categories.",
      },
      {
        id: "openapi",
        label: "OpenAPI / API-first",
        explanation:
          "An OpenAPI (Swagger) specification must be present so other services can integrate automatically. Checked via openapi.yaml/json or swagger.yaml/json in the repository.",
      },
      {
        id: "adrvalidator",
        label: "NL API Design Rules",
        explanation:
          "API specifications must comply with the Common Ground API Design Rules (ADR), the Dutch government's standard for API design. Rules cover naming conventions, security, versioning, and more.",
      },
    ],
  },
  {
    category: "Software Quality",
    criteria: [
      {
        id: "sourcecode",
        label: "Source code",
        explanation:
          "The repository must contain real source code (Python, JavaScript, Java, Go, etc.), not just documentation or configuration files. This verifies the repository is a real software project.",
      },
      {
        id: "sbom",
        label: "SBOM",
        explanation:
          "A Software Bill of Materials (SBOM) lists every dependency and its version. Common formats are SPDX (.spdx.json) and CycloneDX (.cdx.json / bom.xml). Currently a recommended — not mandatory — check.",
      },
      {
        id: "documentation",
        label: "Documentation",
        explanation:
          "Documentation should be available for users and integrators. This checker looks for common docs files in the repository and optionally accepts a separate documentation site URL.",
      },
      {
        id: "tests",
        label: "Test suite presence",
        explanation:
          "Checks for common test directories, test file naming conventions, or test configuration files.",
      },
      {
        id: "complexity",
        label: "Cyclomatic complexity",
        explanation:
          "Clones the analyzed repository and runs Lizard locally. The criterion passes when average cyclomatic complexity (AvgCCN) stays within the configured threshold, and the maximum cyclomatic complexity stays within the configured threshold.",
      },
      {
        id: "codemetrics",
        label: "Code metrics",
        explanation:
          "Shows supplementary repository metrics as supporting information: total lines of code (NLOC) and function count. This criterion is informative and does not contribute to the overall score by default.",
        requirementLevel: "informative",
      },
      {
        id: "owaspsecurecoding",
        label: "OWASP Secure Coding",
        explanation:
          "Runs a heuristic static scan for common risky coding patterns aligned with OWASP secure coding concerns, such as dynamic code execution, weak hashes, disabled TLS verification, or possible hardcoded secrets.",
      },
      {
        id: "semver",
        label: "Semantic versioning",
        explanation:
          "Checks whether the detected repository version follows semantic versioning (MAJOR.MINOR.PATCH), optionally with prerelease/build metadata.",
      },
    ],
  },
  {
    category: "Deployment & Operations",
    criteria: [
      {
        id: "docker",
        label: "Docker support",
        explanation:
          "Checks for Docker support in the source repository via Dockerfile and/or docker-compose files.",
      },
      {
        id: "dockerimage",
        label: "Available Docker image",
        explanation:
          "Checks whether a Docker image location is provided (for example a container registry URL), so deployments can pull a ready-to-run image.",
      },
      {
        id: "helmchart",
        label: "Helm chart (Kubernetes)",
        explanation:
          "Haven is the Dutch government standard for Kubernetes deployments. Charts must include resource limits, liveness/readiness probes, a security context, and NetworkPolicy manifests.",
      },
    ],
  },
] ;

const ALL_CRITERION_FIELDS = CRITERION_CATEGORIES.flatMap((group) =>
  group.criteria
);

interface AdminWeightsFormProps {
  initialWeights: Record<string, number>;
  defaultWeights: Record<string, number>;
  initialRequirementLevels: Record<string, string>;
  defaultRequirementLevels: Record<string, string>;
  initialComplexityThreshold: number;
  defaultComplexityThreshold: number;
  initialComplexityMaxCcnThreshold: number;
  defaultComplexityMaxCcnThreshold: number;
  initialSpectralRulesetSource: string;
  defaultSpectralRulesetSource: string;
}

export default function AdminWeightsForm({
  initialWeights,
  defaultWeights,
  initialRequirementLevels,
  defaultRequirementLevels,
  initialComplexityThreshold,
  defaultComplexityThreshold,
  initialComplexityMaxCcnThreshold,
  defaultComplexityMaxCcnThreshold,
  initialSpectralRulesetSource,
  defaultSpectralRulesetSource,
}: AdminWeightsFormProps) {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const [requirementLevels, setRequirementLevels] = useState<Record<string, string>>(initialRequirementLevels);
  const [complexityThreshold, setComplexityThreshold] = useState<number>(
    initialComplexityThreshold
  );
  const [complexityMaxCcnThreshold, setComplexityMaxCcnThreshold] =
    useState<number>(initialComplexityMaxCcnThreshold);
  const [spectralRulesetSource, setSpectralRulesetSource] = useState<string>(
    initialSpectralRulesetSource
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    const weightChanged = ALL_CRITERION_FIELDS.some(({ id }) => {
      const current = Number(weights[id] ?? 0);
      const initial = Number(initialWeights[id] ?? 0);
      return current !== initial;
    });

    const reqLevelChanged = ALL_CRITERION_FIELDS.some(({ id }) => {
      return (requirementLevels[id] ?? "") !== (initialRequirementLevels[id] ?? "");
    });

    return (
      weightChanged ||
      reqLevelChanged ||
      complexityThreshold !== initialComplexityThreshold ||
      complexityMaxCcnThreshold !== initialComplexityMaxCcnThreshold ||
      spectralRulesetSource.trim() !== initialSpectralRulesetSource.trim()
    );
  }, [
    weights,
    initialWeights,
    requirementLevels,
    initialRequirementLevels,
    complexityThreshold,
    initialComplexityThreshold,
    complexityMaxCcnThreshold,
    initialComplexityMaxCcnThreshold,
    spectralRulesetSource,
    initialSpectralRulesetSource,
  ]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criterionWeights: weights,
          criterionRequirementLevels: requirementLevels,
          complexityThreshold,
          complexityMaxCcnThreshold,
          spectralRulesetSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not save configuration.");
      } else {
        setMessage("Configuration saved. New analyses will use this configuration.");
        if (data?.criterionWeights && typeof data.criterionWeights === "object") {
          setWeights(data.criterionWeights as Record<string, number>);
        }
        if (data?.criterionRequirementLevels && typeof data.criterionRequirementLevels === "object") {
          setRequirementLevels(data.criterionRequirementLevels as Record<string, string>);
        }
        if (typeof data?.complexityThreshold === "number") {
          setComplexityThreshold(data.complexityThreshold);
        }
        if (typeof data?.complexityMaxCcnThreshold === "number") {
          setComplexityMaxCcnThreshold(data.complexityMaxCcnThreshold);
        }
        if (typeof data?.spectralRulesetSource === "string") {
          setSpectralRulesetSource(data.spectralRulesetSource);
        }
      }
    } catch {
      setError("Network error while saving configuration.");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setWeights(defaultWeights);
    setRequirementLevels(defaultRequirementLevels);
    setComplexityThreshold(defaultComplexityThreshold);
    setComplexityMaxCcnThreshold(defaultComplexityMaxCcnThreshold);
    setSpectralRulesetSource(defaultSpectralRulesetSource);
    setMessage(null);
    setError(null);
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50/40">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          ADR / Spectral configuration
        </h4>
        <p className="text-xs text-gray-500">
          Configure the Spectral ruleset source used by the "NL API Design Rules" check. You can use a URL or a local file path.
        </p>
        <div className="space-y-1">
          <label htmlFor="spectral-ruleset-source" className="text-sm font-medium text-gray-700">
            Spectral ruleset source
          </label>
          <input
            id="spectral-ruleset-source"
            type="text"
            value={spectralRulesetSource}
            onChange={(event) => setSpectralRulesetSource(event.target.value)}
            placeholder="https://.../ruleset.yaml or ./rulesets/adr.yaml"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {CRITERION_CATEGORIES.map((group) => (
          <div
            key={group.category}
            className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50/40"
          >
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {group.category}
            </h4>
            {group.criteria.map(({ id, label, explanation, requirementLevel }) => {
              const isInformative = requirementLevel === "informative";
              const value = Number(weights[id] ?? 0);
              const currentLevel = requirementLevels[id] ?? requirementLevel ?? "recommended";
              const isSliderDisabled = isInformative || currentLevel === "recommended";
              return (
                <div key={id} className="space-y-1">
                  <p className="text-xs text-gray-500">{explanation}</p>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={`weight-${id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      {isInformative ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-blue-300 text-blue-700 bg-blue-50">
                          Informative
                        </span>
                      ) : (
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setRequirementLevels((prev) => ({ ...prev, [id]: "mandatory" }))}
                            className={`px-2.5 py-1 transition-colors ${
                              currentLevel === "mandatory"
                                ? "bg-red-600 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Mandatory
                          </button>
                          <button
                            type="button"
                            onClick={() => setRequirementLevels((prev) => ({ ...prev, [id]: "recommended" }))}
                            className={`px-2.5 py-1 border-l border-gray-200 transition-colors ${
                              currentLevel === "recommended"
                                ? "bg-amber-500 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Recommended
                          </button>
                        </div>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 text-gray-700 bg-white min-w-[52px] text-center">
                        {isInformative ? "N/A" : value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {!isInformative && (
                    <input
                      id={`weight-${id}`}
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={value}
                      disabled={isSliderDisabled}
                      onChange={(event) => {
                        if (isSliderDisabled) return;
                        const next = Number(event.target.value);
                        setWeights((prev) => ({ ...prev, [id]: next }));
                      }}
                      className="w-full accent-cg-lightblue disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  )}
                  {isInformative && (
                    <p className="text-xs text-gray-500">
                      Informative criteria do not use a weight and are excluded from scoring.
                    </p>
                  )}
                  {!isInformative && currentLevel === "recommended" && (
                    <p className="text-xs text-gray-500">
                      Recommended criteria do not contribute to the score, so their weight is disabled.
                    </p>
                  )}

                  {id === "complexity" && (
                    <div className="mt-3 space-y-2 border border-gray-200 rounded-xl p-4 bg-white/70">
                      <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Complexity thresholds
                      </h5>
                      <p className="text-xs text-gray-500">
                        Configure Lizard thresholds for the cyclomatic complexity criterion.
                      </p>
                      <div className="flex items-center gap-3">
                        <label htmlFor="complexity-threshold" className="text-sm font-medium text-gray-700">
                          Lizard threshold (AvgCCN)
                        </label>
                        <input
                          id="complexity-threshold"
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          value={complexityThreshold}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (!Number.isFinite(next)) return;
                            setComplexityThreshold(Math.max(1, Math.min(100, Math.round(next))));
                          }}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label htmlFor="complexity-max-ccn-threshold" className="text-sm font-medium text-gray-700">
                          Lizard threshold (Max CCN)
                        </label>
                        <input
                          id="complexity-max-ccn-threshold"
                          type="number"
                          min={1}
                          max={200}
                          step={1}
                          value={complexityMaxCcnThreshold}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (!Number.isFinite(next)) return;
                            setComplexityMaxCcnThreshold(
                              Math.max(1, Math.min(200, Math.round(next)))
                            );
                          }}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={saving || !hasChanges}
          className="px-4 py-2 rounded-lg bg-cg-blue text-white font-semibold hover:bg-cg-lightblue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save configuration"}
        </button>
        <button
          type="button"
          onClick={resetToDefaults}
          disabled={saving}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          Reset to defaults
        </button>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}
