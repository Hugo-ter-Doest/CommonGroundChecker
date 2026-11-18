/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CheckReport = {
    properties: {
        repoUrl: {
            type: 'string',
            isRequired: true,
        },
        owner: {
            type: 'string',
            isRequired: true,
        },
        repo: {
            type: 'string',
            isRequired: true,
        },
        checkedAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        scoringConfigId: {
            type: 'string',
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
        scannedRef: {
            type: 'string',
            description: `The branch or tag name that was scanned`,
            isRequired: true,
        },
        scannedRefKind: {
            type: 'string',
            description: `How the scanned ref was chosen: default-branch, branch, release, or tag (the newest semver tag when there is no release)`,
            isRequired: true,
        },
        scannedCommit: {
            type: 'string',
            description: `The commit SHA that was scanned`,
            isRequired: true,
            isNullable: true,
        },
        scanRefWarning: {
            type: 'string',
            description: `Set when the requested ref could not be used as asked, for example when there is no release to scan`,
        },
        repoMeta: {
            type: 'RepoMeta',
            isRequired: true,
        },
    },
} as const;
