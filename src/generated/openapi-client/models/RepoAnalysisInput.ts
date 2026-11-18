/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckResult } from './CheckResult';
export type RepoAnalysisInput = {
    scoringConfigId?: string | null;
    checkedAt: string;
    version?: string | null;
    /**
     * The branch or tag name that was scanned, for example development or v1.2.0
     */
    scannedRef?: string | null;
    /**
     * Why the scanned ref was chosen: declared-version (the tag of the publiccode.yml softwareVersion), release (the newest stable release), tag (the newest stable semver tag), branch (named in the request), default-branch (asked for), or default-branch-fallback (no release found)
     */
    scannedRefKind?: string | null;
    /**
     * The commit SHA that was scanned
     */
    scannedCommit?: string | null;
    score: number;
    results: Array<CheckResult>;
};

