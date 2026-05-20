/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RepoMetadata = {
    properties: {
        repoUrl: {
            type: 'string',
            isRequired: true,
        },
        description: {
            type: 'string',
        },
        language: {
            type: 'string',
        },
        stars: {
            type: 'number',
        },
        forks: {
            type: 'number',
        },
        defaultBranch: {
            type: 'string',
        },
        topics: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        license: {
            type: 'string',
        },
        version: {
            type: 'string',
        },
        versionEvidenceSource: {
            type: 'string',
        },
        versionEvidenceDetail: {
            type: 'string',
        },
        helmChartLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        dockerLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        apiSpecificationLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        documentationLocations: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
    },
} as const;
