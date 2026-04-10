import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_CRITERION_CONFIG_BY_CHECK_ID,
  getScoringConfig,
  saveCriterionWeights,
} from "@/lib/checkers/config";

function extractWeightsFromPayload(payload: unknown): Record<string, number> {
  if (!payload || typeof payload !== "object") return {};

  const raw = payload as Record<string, unknown>;
  const result: Record<string, number> = {};

  for (const checkId of Object.keys(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID)) {
    const value = raw[checkId];
    if (typeof value === "number" && Number.isFinite(value)) {
      result[checkId] = value;
    }
  }

  return result;
}

export async function GET() {
  try {
    const scoringConfig = await getScoringConfig();

    return NextResponse.json({
      criterionWeights: Object.fromEntries(
        Object.entries(scoringConfig.criterionConfigByCheckId).map(([checkId, config]) => [
          checkId,
          config.weight,
        ])
      ),
      defaultCriterionWeights: Object.fromEntries(
        Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => [
          checkId,
          config.weight,
        ])
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reset = body?.reset === true;

    const activeConfig = reset
      ? await saveCriterionWeights({})
      : await saveCriterionWeights(extractWeightsFromPayload(body?.criterionWeights));

    return NextResponse.json({
      ok: true,
      scoringConfigId: activeConfig.id,
      criterionWeights: Object.fromEntries(
        Object.entries(activeConfig.config.criterionConfigByCheckId).map(([checkId, config]) => [
          checkId,
          config.weight,
        ])
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
