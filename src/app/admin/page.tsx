import Link from "next/link";
import AdminWeightsForm from "@/components/AdminWeightsForm";
import {
  DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD,
  DEFAULT_COMPLEXITY_THRESHOLD,
  DEFAULT_CRITERION_CONFIG_BY_CHECK_ID,
  getScoringConfig,
} from "@/lib/checkers/config";

export default async function AdminPage() {
  const scoringConfig = await getScoringConfig();

  const initialWeights = Object.fromEntries(
    Object.entries(scoringConfig.criterionConfigByCheckId).map(([checkId, config]) => [
      checkId,
      config.weight,
    ])
  );

  const initialRequirementLevels = Object.fromEntries(
    Object.entries(scoringConfig.criterionConfigByCheckId).map(([checkId, config]) => [
      checkId,
      config.requirementLevel,
    ])
  );

  const defaultWeights = Object.fromEntries(
    Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
      checkId,
      config.weight,
    ])
  );

  const defaultRequirementLevels = Object.fromEntries(
    Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
      checkId,
      config.requirementLevel,
    ])
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <nav className="flex items-center justify-end gap-4 text-sm">
        <Link href="/" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Checker
        </Link>
        <Link href="/history" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          History
        </Link>
        <Link href="/admin" className="text-cg-lightblue hover:underline font-medium">
          Admin
        </Link>
        <Link href="/about" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          About
        </Link>
      </nav>

      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-cg-blue">Admin — Scoring Weights</h2>
        <p className="text-gray-600">
          Configure criterion weights used for new analyses.
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
        <p>
          A repository with an EUPL license can receive an additional <strong>+10 bonus points</strong>, capped so the final score never exceeds <strong>100</strong>.
        </p>
      </section>

      <AdminWeightsForm
        initialWeights={initialWeights}
        defaultWeights={defaultWeights}
        initialRequirementLevels={initialRequirementLevels}
        defaultRequirementLevels={defaultRequirementLevels}
        initialComplexityThreshold={scoringConfig.complexityThreshold}
        defaultComplexityThreshold={DEFAULT_COMPLEXITY_THRESHOLD}
        initialComplexityMaxCcnThreshold={
          scoringConfig.complexityMaxCcnThreshold
        }
        defaultComplexityMaxCcnThreshold={
          DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD
        }
      />
    </div>
  );
}
