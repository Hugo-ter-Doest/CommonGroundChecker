"use client";

import { useMemo, useState } from "react";

interface CriterionField {
  id: string;
  label: string;
  explanation: string;
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
          "The component must carry an OSI-approved open-source license (e.g. EUPL-1.2, MIT, Apache-2.0). A EUPL license earns bonus points because it is the EU recommended licence for public-sector software.",
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
        id: "openapi",
        label: "OpenAPI / API-first",
        explanation:
          "An OpenAPI (Swagger) specification must be present so other services can integrate automatically. Checked via openapi.yaml/json or swagger.yaml/json in the repository.",
      },
      {
        id: "fivelayer",
        label: "5-layer architecture",
        explanation:
          "Common Ground defines a 5-layer model (Interaction, Process, Integration, Services, Data). Repositories should not combine multiple layers in one codebase. Checked by scanning directory names and publiccode.yml categories.",
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
          "Clones the analyzed repository and runs Lizard locally. The criterion passes when average cyclomatic complexity (AvgCCN) stays within the configured threshold.",
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
  initialComplexityThreshold: number;
  defaultComplexityThreshold: number;
  initialComplexityMaxCcnThreshold: number;
  defaultComplexityMaxCcnThreshold: number;
}

export default function AdminWeightsForm({
  initialWeights,
  defaultWeights,
  initialComplexityThreshold,
  defaultComplexityThreshold,
  initialComplexityMaxCcnThreshold,
  defaultComplexityMaxCcnThreshold,
}: AdminWeightsFormProps) {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const [complexityThreshold, setComplexityThreshold] = useState<number>(
    initialComplexityThreshold
  );
  const [complexityMaxCcnThreshold, setComplexityMaxCcnThreshold] =
    useState<number>(initialComplexityMaxCcnThreshold);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    const weightChanged = ALL_CRITERION_FIELDS.some(({ id }) => {
      const current = Number(weights[id] ?? 0);
      const initial = Number(initialWeights[id] ?? 0);
      return current !== initial;
    });

    return (
      weightChanged ||
      complexityThreshold !== initialComplexityThreshold ||
      complexityMaxCcnThreshold !== initialComplexityMaxCcnThreshold
    );
  }, [
    weights,
    initialWeights,
    complexityThreshold,
    initialComplexityThreshold,
    complexityMaxCcnThreshold,
    initialComplexityMaxCcnThreshold,
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
          complexityThreshold,
          complexityMaxCcnThreshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not save weights.");
      } else {
        setMessage("Weights saved. New analyses will use this configuration.");
        if (data?.criterionWeights && typeof data.criterionWeights === "object") {
          setWeights(data.criterionWeights as Record<string, number>);
        }
        if (typeof data?.complexityThreshold === "number") {
          setComplexityThreshold(data.complexityThreshold);
        }
        if (typeof data?.complexityMaxCcnThreshold === "number") {
          setComplexityMaxCcnThreshold(data.complexityMaxCcnThreshold);
        }
      }
    } catch {
      setError("Network error while saving weights.");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setWeights(defaultWeights);
    setComplexityThreshold(defaultComplexityThreshold);
    setComplexityMaxCcnThreshold(defaultComplexityMaxCcnThreshold);
    setMessage(null);
    setError(null);
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Criteria weights</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set how much each criterion influences the total score (0 to 1).
        </p>
      </div>

      <div className="space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50/40">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Complexity threshold
        </h4>
        <p className="text-xs text-gray-500">
          Maximum average cyclomatic complexity (AvgCCN) accepted by the Lizard
          check. Repositories with AvgCCN above this value fail the criterion.
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

      <div className="space-y-4">
        {CRITERION_CATEGORIES.map((group) => (
          <div
            key={group.category}
            className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50/40"
          >
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {group.category}
            </h4>
            {group.criteria.map(({ id, label, explanation }) => {
              const value = Number(weights[id] ?? 0);
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
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-300 text-gray-700 bg-white min-w-[52px] text-center">
                      {value.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id={`weight-${id}`}
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={value}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setWeights((prev) => ({ ...prev, [id]: next }));
                    }}
                    className="w-full accent-cg-lightblue"
                  />
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
          {saving ? "Saving…" : "Save weights"}
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
