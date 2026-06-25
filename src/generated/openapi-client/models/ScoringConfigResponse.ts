/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScoringConfigResponse = {
    ok?: boolean;
    scoringConfigId: string | null;
    complexityThreshold: number;
    complexityMaxCcnThreshold: number;
    spectralRulesetSource: string;
    criterionWeights: Record<string, number>;
    criterionRequirementLevels: Record<string, 'mandatory' | 'recommended'>;
    categoryWeights: Record<string, number>;
    defaultCriterionWeights: Record<string, number>;
    defaultCriterionRequirementLevels: Record<string, 'mandatory' | 'recommended' | 'informative'>;
    defaultCategoryWeights: Record<string, number>;
    defaultComplexityThreshold: number;
    defaultComplexityMaxCcnThreshold: number;
    defaultSpectralRulesetSource: string;
};

