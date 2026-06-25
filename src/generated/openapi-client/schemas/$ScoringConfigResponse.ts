/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ScoringConfigResponse = {
    properties: {
        ok: {
            type: 'boolean',
        },
        scoringConfigId: {
            type: 'string',
            isRequired: true,
            isNullable: true,
        },
        complexityThreshold: {
            type: 'number',
            isRequired: true,
        },
        complexityMaxCcnThreshold: {
            type: 'number',
            isRequired: true,
        },
        spectralRulesetSource: {
            type: 'string',
            isRequired: true,
        },
        criterionWeights: {
            type: 'dictionary',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        criterionRequirementLevels: {
            type: 'dictionary',
            contains: {
                type: 'Enum',
            },
            isRequired: true,
        },
        categoryWeights: {
            type: 'dictionary',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        defaultCriterionWeights: {
            type: 'dictionary',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        defaultCriterionRequirementLevels: {
            type: 'dictionary',
            contains: {
                type: 'Enum',
            },
            isRequired: true,
        },
        defaultCategoryWeights: {
            type: 'dictionary',
            contains: {
                type: 'number',
            },
            isRequired: true,
        },
        defaultComplexityThreshold: {
            type: 'number',
            isRequired: true,
        },
        defaultComplexityMaxCcnThreshold: {
            type: 'number',
            isRequired: true,
        },
        defaultSpectralRulesetSource: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
