/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RepoAnalysisOutput = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        repoId: {
            type: 'string',
            isRequired: true,
        },
        scoringConfigId: {
            type: 'string',
            isNullable: true,
        },
        checkedAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        version: {
            type: 'string',
            isNullable: true,
        },
        scannedRef: {
            type: 'string',
            description: `The branch or tag name that was scanned, for example development or v1.2.0`,
            isNullable: true,
        },
        scannedRefKind: {
            type: 'string',
            description: `How the scanned ref was chosen: default-branch, branch, release, or tag (the newest semver tag when there is no release)`,
            isNullable: true,
        },
        scannedCommit: {
            type: 'string',
            description: `The commit SHA that was scanned`,
            isNullable: true,
        },
        score: {
            type: 'number',
            isRequired: true,
        },
        results: {
            type: 'array',
            contains: {
                type: 'CheckResult',
            },
            isRequired: true,
        },
        createdAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
    },
} as const;
