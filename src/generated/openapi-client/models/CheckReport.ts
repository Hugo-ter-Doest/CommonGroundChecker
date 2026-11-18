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
     * Why the scanned ref was chosen: declared-version (the tag of the publiccode.yml softwareVersion), release (the newest stable release), tag (the newest stable semver tag), branch (named in the request), default-branch (asked for), or default-branch-fallback (no release found)
     */
    scannedRefKind: string;
    /**
     * The commit SHA that was scanned
     */
    scannedCommit: string | null;
    /**
     * Set when no released version was found and the default branch was scanned instead
     */
    scanRefWarning?: string;
    repoMeta: RepoMeta;
};

