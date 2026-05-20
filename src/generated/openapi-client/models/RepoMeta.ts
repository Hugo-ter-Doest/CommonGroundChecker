/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RepoMeta = {
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    defaultBranch: string;
    topics: Array<string>;
    license: string | null;
    version: string | null;
    versionEvidence: {
        source: RepoMeta.source;
        detail: string;
    };
};
export namespace RepoMeta {
    export enum source {
        RELEASE = 'release',
        TAG = 'tag',
        MANIFEST = 'manifest',
        README = 'readme',
        NONE = 'none',
    }
}

