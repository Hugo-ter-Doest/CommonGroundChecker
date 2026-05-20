/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RepoSummary = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        owner: {
            type: 'string',
            isRequired: true,
        },
        name: {
            type: 'string',
            isRequired: true,
        },
        repoUrl: {
            type: 'string',
            isRequired: true,
        },
        helmChartLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        dockerLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        apiSpecificationLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        documentationLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        updatedAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        analysisCount: {
            type: 'number',
            isRequired: true,
        },
        latestAnalysis: {
            type: 'any',
            isRequired: true,
            isNullable: true,
        },
    },
} as const;
