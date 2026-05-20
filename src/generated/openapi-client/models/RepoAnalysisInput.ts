/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckResult } from './CheckResult';
export type RepoAnalysisInput = {
    scoringConfigId?: string | null;
    checkedAt: string;
    version?: string | null;
    score: number;
    results: Array<CheckResult>;
};

