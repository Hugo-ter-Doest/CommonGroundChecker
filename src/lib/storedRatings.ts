import { getActiveScoringConfig } from "./checkers/config";
import { hasStoredRatings, ratingsForStoredAnalysis, type StoredAnalysis } from "./ratings";

/**
 * The ratings of stored analyses. Analyses saved before ratings existed are
 * rated from their results with the active scoring config.
 */
export async function loadStoredRatings(
  analyses: StoredAnalysis[]
): Promise<Array<ReturnType<typeof ratingsForStoredAnalysis>>> {
  const config = analyses.every(hasStoredRatings)
    ? { criterionConfigByCheckId: {} }
    : (await getActiveScoringConfig()).config;
  return analyses.map((analysis) => ratingsForStoredAnalysis(analysis, config));
}
