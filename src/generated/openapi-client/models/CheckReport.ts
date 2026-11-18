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
    /**
     * The branch or tag name that was scanned
     */
    scannedRef: string;
    /**
     * How the scanned ref was chosen: default-branch, branch, release, or tag (the newest semver tag when there is no release)
     */
    scannedRefKind: string;
    /**
     * The commit SHA that was scanned
     */
    scannedCommit: string | null;
    /**
     * Set when the requested ref could not be used as asked, for example when there is no release to scan
     */
    scanRefWarning?: string;
    repoMeta: RepoMeta;
};

