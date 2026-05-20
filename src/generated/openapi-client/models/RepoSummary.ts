/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RepoSummary = {
    id: string;
    owner: string;
    name: string;
    repoUrl: string;
    helmChartLocations: Array<string>;
    dockerLocations: Array<string>;
    apiSpecificationLocations: Array<string>;
    documentationLocations: Array<string>;
    updatedAt: string;
    analysisCount: number;
    latestAnalysis: any | null;
};

