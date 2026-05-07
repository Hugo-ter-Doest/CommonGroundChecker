import AdminWeightsForm from "@/components/AdminWeightsForm";
import { getAdminScoring } from "@/lib/apiClient";
import {
  DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD,
  DEFAULT_COMPLEXITY_THRESHOLD,
  DEFAULT_CRITERION_CONFIG_BY_CHECK_ID,
  DEFAULT_SPECTRAL_RULESET_SOURCE,
} from "@/lib/checkers/config";

function buildDefaultConfig() {
  return {
    defaultCriterionWeights: Object.fromEntries(
      Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
        checkId,
        config.weight,
      ])
    ),
    defaultCriterionRequirementLevels: Object.fromEntries(
      Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
        checkId,
        config.requirementLevel,
      ])
    ),
    defaultComplexityThreshold: DEFAULT_COMPLEXITY_THRESHOLD,
    defaultComplexityMaxCcnThreshold: DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD,
    defaultSpectralRulesetSource: DEFAULT_SPECTRAL_RULESET_SOURCE,
  };
}

export default async function AdminPage() {
  let successData = null;
  let error: string | undefined;

  try {
    successData = await getAdminScoring();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to connect to admin scoring API.";
  }

  const defaults = buildDefaultConfig();

  const initialWeights = successData?.criterionWeights ?? defaults.defaultCriterionWeights;
  const initialRequirementLevels =
    successData?.criterionRequirementLevels ?? defaults.defaultCriterionRequirementLevels;

  const defaultWeights = defaults.defaultCriterionWeights;
  const defaultRequirementLevels = defaults.defaultCriterionRequirementLevels;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-cg-blue">Admin — Scoring Configuration</h2>
        <p className="text-gray-600">
          Configure scoring weights, thresholds, and ruleset used for new analyses.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 text-sm text-gray-700">
        <h3 className="text-base font-semibold text-gray-900">How the overall score is calculated</h3>
        <p>
          The overall score is a weighted average of <strong>mandatory</strong> checker results only. Each mandatory criterion has a weight,
          and each result status is converted to a numeric score: <strong>pass = 1</strong>, <strong>warn = 0.5</strong>, and <strong>fail = 0</strong>.
        </p>
        <p>
          For each mandatory criterion, the status score is multiplied by its configured weight. The checker then divides the total weighted score by the sum of mandatory weights and converts that to a percentage.
        </p>
        <p>
          <strong>Recommended</strong> and <strong>informative</strong> criteria are shown in reports, but they do <strong>not</strong> contribute to the numeric score.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load admin settings: {error}
        </div>
      ) : null}

      <AdminWeightsForm
        initialWeights={initialWeights}
        defaultWeights={defaultWeights}
        initialRequirementLevels={initialRequirementLevels}
        defaultRequirementLevels={defaultRequirementLevels}
        initialComplexityThreshold={
          successData?.complexityThreshold ?? defaults.defaultComplexityThreshold
        }
        defaultComplexityThreshold={defaults.defaultComplexityThreshold}
        initialComplexityMaxCcnThreshold={
          successData?.complexityMaxCcnThreshold ?? defaults.defaultComplexityMaxCcnThreshold
        }
        defaultComplexityMaxCcnThreshold={
          defaults.defaultComplexityMaxCcnThreshold
        }
        initialSpectralRulesetSource={
          successData?.spectralRulesetSource ?? defaults.defaultSpectralRulesetSource
        }
        defaultSpectralRulesetSource={defaults.defaultSpectralRulesetSource}
      />
    </div>
  );
}
