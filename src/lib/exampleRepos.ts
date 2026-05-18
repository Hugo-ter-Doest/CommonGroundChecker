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
];

export const STARTER_REPOS: ExampleRepository[] = EXAMPLE_REPOS;
