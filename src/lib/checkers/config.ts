import type { CheckStatus, RequirementLevel } from "../types";
import { prisma } from "../db";

export interface CriterionConfig {
  weight: number;
  requirementLevel: RequirementLevel;
}

interface ScoringConfigOverrides {
  criterionWeights?: Record<string, number>;
  complexityThreshold?: number;
  complexityMaxCcnThreshold?: number;
}

export interface ScoringConfig {
  criterionConfigByCheckId: Record<string, CriterionConfig>;
  statusScoreByStatus: Record<CheckStatus, number>;
  euplBonusPoints: number;
  complexityThreshold: number;
  complexityMaxCcnThreshold: number;
}

export interface ActiveScoringConfig {
  id: string | null;
  config: ScoringConfig;
}

export const DEFAULT_STATUS_SCORE_BY_STATUS: Record<CheckStatus, number> = {
  pass: 1,
  warn: 0.5,
  info: 0.5,
  fail: 0,
};

export const DEFAULT_EUPL_BONUS_POINTS = 10;
export const DEFAULT_COMPLEXITY_THRESHOLD = 15;
export const DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD = 30;

export const DEFAULT_CRITERION_CONFIG_BY_CHECK_ID: Record<string, CriterionConfig> = {
  sourcecode: { weight: 1, requirementLevel: "mandatory" },
  openapi: { weight: 1, requirementLevel: "mandatory" },
  license: { weight: 1, requirementLevel: "mandatory" },
  publiccode: { weight: 1, requirementLevel: "mandatory" },
  docker: { weight: 1, requirementLevel: "mandatory" },
  dockerimage: { weight: 1, requirementLevel: "mandatory" },
  helmchart: { weight: 1, requirementLevel: "mandatory" },
  documentation: { weight: 1, requirementLevel: "mandatory" },
  tests: { weight: 0.75, requirementLevel: "recommended" },
  complexity: { weight: 0.75, requirementLevel: "recommended" },
  contributing: { weight: 0.5, requirementLevel: "recommended" },
  codeofconduct: { weight: 0.5, requirementLevel: "recommended" },
  security: { weight: 0.75, requirementLevel: "recommended" },
  semver: { weight: 0.75, requirementLevel: "recommended" },
  sbom: { weight: 0.75, requirementLevel: "recommended" },
  fivelayer: { weight: 0.75, requirementLevel: "recommended" },
};

function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function clampComplexityThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COMPLEXITY_THRESHOLD;
  const rounded = Math.round(value);
  return Math.max(1, Math.min(100, rounded));
}

function clampComplexityMaxCcnThreshold(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD;
  const rounded = Math.round(value);
  return Math.max(1, Math.min(200, rounded));
}

function buildScoringConfig(overrides?: ScoringConfigOverrides): ScoringConfig {
  const criterionConfigByCheckId: Record<string, CriterionConfig> =
    Object.fromEntries(
      Object.entries(DEFAULT_CRITERION_CONFIG_BY_CHECK_ID).map(([checkId, config]) => {
        const overrideWeight = overrides?.criterionWeights?.[checkId];
        return [
          checkId,
          {
            requirementLevel: config.requirementLevel,
            weight:
              typeof overrideWeight === "number"
                ? clampWeight(overrideWeight)
                : config.weight,
          },
        ];
      })
    );

  return {
    criterionConfigByCheckId,
    statusScoreByStatus: { ...DEFAULT_STATUS_SCORE_BY_STATUS },
    euplBonusPoints: DEFAULT_EUPL_BONUS_POINTS,
    complexityThreshold:
      typeof overrides?.complexityThreshold === "number"
        ? clampComplexityThreshold(overrides.complexityThreshold)
        : DEFAULT_COMPLEXITY_THRESHOLD,
    complexityMaxCcnThreshold:
      typeof overrides?.complexityMaxCcnThreshold === "number"
        ? clampComplexityMaxCcnThreshold(overrides.complexityMaxCcnThreshold)
        : DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD,
  };
}

function parseOverridesFromDbPayload(payload: unknown): ScoringConfigOverrides {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const candidate = payload as Record<string, unknown>;
  const criterionWeightsRaw = candidate.criterionWeights;
  const complexityThresholdRaw = candidate.complexityThreshold;
  const complexityMaxCcnThresholdRaw = candidate.complexityMaxCcnThreshold;
  if (!criterionWeightsRaw || typeof criterionWeightsRaw !== "object") {
    const result: ScoringConfigOverrides = {};
    if (typeof complexityThresholdRaw === "number") {
      result.complexityThreshold = clampComplexityThreshold(
        complexityThresholdRaw
      );
    }
    if (typeof complexityMaxCcnThresholdRaw === "number") {
      result.complexityMaxCcnThreshold = clampComplexityMaxCcnThreshold(
        complexityMaxCcnThresholdRaw
      );
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
    return {};
  }

  const criterionWeights: Record<string, number> = {};
  for (const [checkId, weight] of Object.entries(
    criterionWeightsRaw as Record<string, unknown>
  )) {
    if (typeof weight === "number" && Number.isFinite(weight)) {
      criterionWeights[checkId] = weight;
    }
  }

  return {
    criterionWeights,
    complexityThreshold:
      typeof complexityThresholdRaw === "number"
        ? clampComplexityThreshold(complexityThresholdRaw)
        : undefined,
    complexityMaxCcnThreshold:
      typeof complexityMaxCcnThresholdRaw === "number"
        ? clampComplexityMaxCcnThreshold(complexityMaxCcnThresholdRaw)
        : undefined,
  };
}

async function readLatestDbOverrides(): Promise<{
  id: string;
  overrides: ScoringConfigOverrides;
} | null> {
  const row = await prisma.scoringConfig.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      criterionWeights: true,
      complexityThreshold: true,
      complexityMaxCcnThreshold: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    overrides: parseOverridesFromDbPayload({
      criterionWeights: row.criterionWeights,
      complexityThreshold: row.complexityThreshold,
      complexityMaxCcnThreshold: row.complexityMaxCcnThreshold,
    }),
  };
}

async function createDbOverridesRecord(
  overrides: ScoringConfigOverrides
): Promise<string> {
  const created = await prisma.scoringConfig.create({
    data: {
      criterionWeights: overrides.criterionWeights ?? {},
      complexityThreshold: clampComplexityThreshold(
        overrides.complexityThreshold ?? DEFAULT_COMPLEXITY_THRESHOLD
      ),
      complexityMaxCcnThreshold: clampComplexityMaxCcnThreshold(
        overrides.complexityMaxCcnThreshold ??
          DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD
      ),
    },
  });

  return created.id;
}

export async function getScoringConfig(): Promise<ScoringConfig> {
  const active = await getActiveScoringConfig();
  return active.config;
}

export async function getActiveScoringConfig(): Promise<ActiveScoringConfig> {
  try {
    const latest = await readLatestDbOverrides();

    if (!latest) {
      return {
        id: null,
        config: buildScoringConfig(),
      };
    }

    return {
      id: latest.id,
      config: buildScoringConfig(latest.overrides),
    };
  } catch {
    return {
      id: null,
      config: buildScoringConfig(),
    };
  }
}

export async function saveCriterionWeights(
  criterionWeights: Record<string, number>,
  complexityThreshold?: number,
  complexityMaxCcnThreshold?: number
): Promise<ActiveScoringConfig> {
  const overrides: ScoringConfigOverrides = {
    criterionWeights: {},
    complexityThreshold:
      typeof complexityThreshold === "number"
        ? clampComplexityThreshold(complexityThreshold)
        : DEFAULT_COMPLEXITY_THRESHOLD,
    complexityMaxCcnThreshold:
      typeof complexityMaxCcnThreshold === "number"
        ? clampComplexityMaxCcnThreshold(complexityMaxCcnThreshold)
        : DEFAULT_COMPLEXITY_MAX_CCN_THRESHOLD,
  };

  for (const [checkId, config] of Object.entries(
    DEFAULT_CRITERION_CONFIG_BY_CHECK_ID
  )) {
    const incoming = criterionWeights[checkId];
    if (typeof incoming !== "number") continue;
    const clamped = clampWeight(incoming);
    if (clamped !== config.weight) {
      overrides.criterionWeights![checkId] = clamped;
    }
  }

  const id = await createDbOverridesRecord(overrides);

  return {
    id,
    config: buildScoringConfig(overrides),
  };
}
