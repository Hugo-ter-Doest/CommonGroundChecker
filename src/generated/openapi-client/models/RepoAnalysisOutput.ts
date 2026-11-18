/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckResult } from './CheckResult';
export type RepoAnalysisOutput = {
    id: string;
    repoId: string;
    scoringConfigId?: string | null;
    checkedAt: string;
    version?: string | null;
    /**
     * The branch or tag name that was scanned, for example development or v1.2.0
     */
    scannedRef?: string | null;
    /**
     * How the scanned ref was chosen: default-branch, branch, release, or tag (the newest semver tag when there is no release)
     */
    scannedRefKind?: string | null;
    /**
     * The commit SHA that was scanned
     */
    scannedCommit?: string | null;
    score: number;
    results: Array<CheckResult>;
    createdAt: string;
};

