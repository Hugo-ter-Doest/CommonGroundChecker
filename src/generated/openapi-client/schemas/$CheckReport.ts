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
        repoMeta: {
            type: 'RepoMeta',
            isRequired: true,
        },
    },
} as const;
