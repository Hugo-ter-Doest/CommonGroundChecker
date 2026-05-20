/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RepoHistoryResponse = {
    properties: {
        repository: {
            properties: {
                id: {
                    type: 'string',
                    isRequired: true,
                },
                repoUrl: {
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
                metadata: {
                    type: 'RepoMeta',
                    isRequired: true,
                },
                createdAt: {
                    type: 'string',
                    isRequired: true,
                    format: 'date-time',
                },
                updatedAt: {
                    type: 'string',
                    isRequired: true,
                    format: 'date-time',
                },
            },
            isRequired: true,
        },
        analyses: {
            type: 'array',
            contains: {
                type: 'RepoAnalysisOutput',
            },
            isRequired: true,
        },
    },
} as const;
