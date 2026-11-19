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
        followed: {
            type: 'boolean',
            description: `Whether the repository is rescanned on a schedule`,
            isRequired: true,
        },
        checkIntervalHours: {
            type: 'number',
            description: `Hours between scheduled checks: 24 (daily), 168 (weekly) or 720 (monthly)`,
            isRequired: true,
        },
        lastCheckedAt: {
            type: 'string',
            description: `When the latest analysis was stored`,
            isRequired: true,
            format: 'date-time',
        },
        nextCheckAt: {
            type: 'string',
            description: `When the repository is next due for a scheduled check`,
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
