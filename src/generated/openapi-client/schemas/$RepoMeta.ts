/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RepoMeta = {
    properties: {
        description: {
            type: 'string',
            isRequired: true,
            isNullable: true,
        },
        language: {
            type: 'string',
            isRequired: true,
            isNullable: true,
        },
        stars: {
            type: 'number',
            isRequired: true,
        },
        forks: {
            type: 'number',
            isRequired: true,
        },
        defaultBranch: {
            type: 'string',
            isRequired: true,
        },
        topics: {
            type: 'array',
            contains: {
                type: 'string',
            },
            isRequired: true,
        },
        license: {
            type: 'string',
            isRequired: true,
            isNullable: true,
        },
        version: {
            type: 'string',
            isRequired: true,
            isNullable: true,
        },
        versionEvidence: {
            properties: {
                source: {
                    type: 'Enum',
                    isRequired: true,
                },
                detail: {
                    type: 'string',
                    isRequired: true,
                },
            },
            isRequired: true,
        },
    },
} as const;
