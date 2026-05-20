/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RepoAnalysisOutput } from './RepoAnalysisOutput';
import type { RepoMeta } from './RepoMeta';
export type RepoHistoryResponse = {
    repository: {
        id: string;
        repoUrl: string;
        owner: string;
        name: string;
        metadata: RepoMeta;
        createdAt: string;
        updatedAt: string;
    };
    analyses: Array<RepoAnalysisOutput>;
};

