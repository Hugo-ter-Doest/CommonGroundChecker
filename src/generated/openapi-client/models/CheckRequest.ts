/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CheckRequest = {
    repoUrl: string;
    helmChartLocations?: Array<string>;
    documentationLocations?: Array<string>;
    dockerLocations?: Array<string>;
    apiSpecificationLocations?: Array<string>;
    isRegister?: boolean;
    /**
     * The branch or tag to scan; empty for the default branch, or "latest-release" for the newest stable release
     */
    ref?: string;
};

