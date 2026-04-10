import Link from "next/link";
import AdminWeightsForm from "@/components/AdminWeightsForm";
import {
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

  const defaultWeights = Object.fromEntries(
    Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
      checkId,
      config.weight,
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

      <AdminWeightsForm
        initialWeights={initialWeights}
        defaultWeights={defaultWeights}
        initialComplexityThreshold={scoringConfig.complexityThreshold}
        defaultComplexityThreshold={DEFAULT_COMPLEXITY_THRESHOLD}
      />
    </div>
  );
}
