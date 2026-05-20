/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckResult } from './CheckResult';
import type { RepoMeta } from './RepoMeta';
export type CheckReport = {
    repoUrl: string;
    owner: string;
    repo: string;
    checkedAt: string;
    scoringConfigId?: string | null;
    score: number;
    results: Array<CheckResult>;
    repoMeta: RepoMeta;
};

