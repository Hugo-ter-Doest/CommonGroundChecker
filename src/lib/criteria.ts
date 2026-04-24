export type CriteriaCategory =
  | "Governance"
  | "Security"
  | "Architecture"
  | "Software Quality"
  | "Deployment & Operations";

export const CATEGORY_ORDER: CriteriaCategory[] = [
  "Governance",
  "Security",
  "Architecture",
  "Software Quality",
  "Deployment & Operations",
];

export const RESULT_ORDER_BY_ID: string[] = [
  "sourcecode",
  "fivelayer",
  "license",
  "eupllicense",
  "copyrightowner",
  "publiccode",
  "docker",
  "dockerimage",
  "cicd",
  "openapi",
  "adrvalidator",
  "helmchart",
  "sbom",
  "documentation",
  "changelog",
  "tests",
  "coverage",
  "complexity",
  "codemetrics",
  "owaspsecurecoding",
  "contributing",
  "codeofconduct",
  "security",
  "semver",
];

export const RESULT_CATEGORY_BY_ID: Record<string, CriteriaCategory> = {
  sourcecode: "Software Quality",
  openapi: "Architecture",
  adrvalidator: "Architecture",
  license: "Governance",
  eupllicense: "Governance",
  copyrightowner: "Governance",
  publiccode: "Governance",
  docker: "Deployment & Operations",
  dockerimage: "Deployment & Operations",
  cicd: "Deployment & Operations",
  helmchart: "Deployment & Operations",
  sbom: "Software Quality",
  documentation: "Software Quality",
  changelog: "Software Quality",
  tests: "Software Quality",
  coverage: "Software Quality",
  complexity: "Software Quality",
  codemetrics: "Software Quality",
  owaspsecurecoding: "Security",
  contributing: "Governance",
  codeofconduct: "Governance",
  security: "Security",
  semver: "Software Quality",
  fivelayer: "Architecture",
};
