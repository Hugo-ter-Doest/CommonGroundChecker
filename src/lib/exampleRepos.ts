export type ExampleRepository = {
  repoUrl: string;
  label: string;
};

export const EXAMPLE_REPOS: ExampleRepository[] = [
  {
    repoUrl: "https://github.com/open-zaak/open-zaak",
    label: "OpenZaak",
  },
  {
    repoUrl: "https://github.com/maykinmedia/objects-api",
    label: "Objects API",
  },
  {
    repoUrl: "https://github.com/maykinmedia/objecttypes-api",
    label: "ObjectTypes API",
  },
  {
    repoUrl: "https://github.com/open-formulieren/open-forms",
    label: "OpenFormulieren",
  },
  {
    repoUrl: "https://github.com/generiekzaakafhandelcomponent/gzac-frontend-template",
    label: "GZAC Frontend Template",
  },
  {
    repoUrl: "https://github.com/generiekzaakafhandelcomponent/gzac-backend-template",
    label: "GZAC Backend Template",
  },
  {
    repoUrl: "https://gitlab.com/rinis-oss/fsc/open-fsc",
    label: "Open FSC",
  }
];

export const STARTER_REPOS: ExampleRepository[] = EXAMPLE_REPOS;
