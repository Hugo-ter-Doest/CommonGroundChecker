import type { DocSource } from "./ratingDocs";
import { TOOLS_DOC_HREF } from "./toolsDocs";

/** Path of the page in the rating guide on how a component becomes a Common Ground component. */
export const PATH_DOC_HREF = "/docs/common-ground-path";

/**
 * Where a part of the path stands: built and in review with its pull request,
 * being built now, or proposed and waiting for a decision by the community.
 */
export type PathStatus = { kind: "in-review"; pr: number } | { kind: "in-development" } | { kind: "proposed" };

export interface PathSection {
  id: string;
  title: string;
  /** Left out when every part of the section is in the checker already */
  status?: PathStatus;
  paragraphs: string[];
  items?: string[];
  /** Parts of the section with a status of their own */
  parts?: { title: string; status?: PathStatus; paragraphs: string[] }[];
}

/** The label shown next to a section or part that is not in the checker yet. */
export function pathStatusLabel(status: PathStatus): string {
  switch (status.kind) {
    case "in-review":
      return `In review (#${status.pr})`;
    case "in-development":
      return "In development";
    case "proposed":
      return "Proposed";
  }
}

export const AUDIENCES: { id: string; title: string; text: string }[] = [
  {
    id: "buyer",
    title: "A buyer",
    text: "You want to know if you can use a component with confidence. Look at the verdict and the level. Suitable means the code is good enough and someone maintains it under a contract. Approved adds that the software is stable, that other organisations use it and that VNG has an SLA with the maintainer.",
  },
  {
    id: "maintainer",
    title: "A maintainer or supplier",
    text: "You want to know what to fix and what you sign up for. Every result says what was measured and what is missing. Maintenance is measured every night against the same criteria, so you know in advance what keeping a component at its level means.",
  },
  {
    id: "municipality",
    title: "A municipality",
    text: "You use components and want a say in what counts. Confirm that you use a component, so it counts towards approval. Propose changes to the checklist, and take part in the consultation and in the management organisation that decides.",
  },
];

/** The path from a public repository to an approved Common Ground component. */
export const PATH_STEPS: string[] = [
  "Publish the component in a public repository with a publiccode.yml.",
  "The checker measures the version you released, not work in progress.",
  "Fix every mandatory criterion and reach an overall rating of at least 2.5.",
  "Make the component maintainable: at least 4 stars for maintainability in the estimate.",
  "Name a maintenance contract in publiccode.yml. The component is now suitable for Common Ground.",
  "Mark the component stable in publiccode.yml. At least two organisations confirm they use it, and VNG agrees an SLA with a maintainer. The component is now approved.",
  "Stay there: the checker measures every night, and a drop below a criterion is fixed within the agreed fix term.",
];

export const PATH_SECTIONS: PathSection[] = [
  {
    id: "version",
    title: "Which version is measured",
    status: { kind: "in-review", pr: 68 },
    paragraphs: [
      "A buyer runs a released version, so the checker measures that version and not the latest commit. It takes the first of these that exists:",
    ],
    items: [
      "the tag that matches softwareVersion in publiccode.yml;",
      "the newest stable release;",
      "the newest stable semver tag, such as 1.4.2 or v1.4.2;",
      "the default branch, with a warning that no released version was found.",
    ],
    parts: [
      {
        title: "Choosing another version",
        paragraphs: [
          "An admin can choose another branch or tag for a component. Every scan records which ref it measured (scannedRef) and which commit (scannedCommit), so a result can always be traced back to the code.",
        ],
      },
    ],
  },
  {
    id: "three-systems",
    title: "Three kinds of result",
    paragraphs: [
      "The checker reports three different things. They answer different questions and must not be mixed up.",
    ],
    items: [
      "Information only: project health, usage and ecosystem, size and the comparison with SonarQube. Shown, never rated, never part of the verdict.",
      "The improvement rating: 1 to 5 stars per aspect, per category and overall. It shows a supplier where a component can improve.",
      "The verdict: suitable for Common Ground or not. It is advice for a buyer.",
    ],
  },
  {
    id: "verdict",
    title: "When a component is suitable",
    status: { kind: "in-review", pr: 56 },
    paragraphs: ["A component is suitable for Common Ground when all four of these hold:"],
    items: [
      "no mandatory criterion fails;",
      "the overall rating is at least 2.5;",
      "the maintainability estimate is at least 4 stars, the level of certification by SIG and TÜViT;",
      "publiccode.yml names a valid maintenance contract.",
    ],
    parts: [
      {
        title: "A valid maintenance contract",
        status: { kind: "in-review", pr: 55 },
        paragraphs: [
          "The criterion Maintained reads maintenance in publiccode.yml. It passes on maintenance.type: contract with at least one contractor that has a name and an until date that has not passed. The types none, internal and community are not a contract. When something is missing or wrong, the checker says exactly what: no name, no end date, an end date that is not a date, an expired contract or an invalid email address.",
        ],
      },
    ],
  },
  {
    id: "levels",
    title: "Two levels: suitable and approved",
    paragraphs: [
      "Suitable for Common Ground means the checker finds that the component meets the technical conditions above. It is advice, not a condition for being listed. A component that is not suitable stays visible.",
    ],
    parts: [
      {
        title: "Approved",
        status: { kind: "in-development" },
        paragraphs: [
          "A component is approved when it is suitable, its developmentStatus in publiccode.yml is stable, at least two organisations confirm they use it, and VNG has an SLA with a maintainer. A component that leaves stable leaves approved. The SLA rests on the hard criteria and the KPIs below. A component with one user is not yet a shared component. The number two is a proposal.",
        ],
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance made measurable",
    status: { kind: "proposed" },
    paragraphs: [
      "The measurement makes clear what maintenance is. A supplier that maintains a component keeps it at the level the checker measures. Maintenance has three parts:",
    ],
    items: [
      "Hard criteria. Every criterion that passes now keeps passing. When one drops, a fix term applies. Examples: a known vulnerability in a dependency, a missing licence header, maintainability below 4 stars.",
      "KPIs. What has no hard limit gets a target: the response time on issues and pull requests, how reports are handled, and the release frequency. The checker already measures these with the CHAOSS metrics.",
      "Bugs. A fault in existing functionality is maintenance.",
    ],
    parts: [
      {
        title: "Nightly measurement and fix terms",
        status: { kind: "in-development" },
        paragraphs: [
          "The checker measures every followed component every night and reports a drop against the previous measurement. When a component drops below a criterion, the maintainer fixes it within the agreed fix term. Every criterion gets a proposed fix term, and every KPI a proposed target.",
        ],
      },
      {
        title: "What is not maintenance",
        paragraphs: [
          "New development is not maintenance. An issue that asks for new or different functionality is development work and is agreed separately.",
          "A component below 4 stars is first made maintainable. Only then can a supplier take it into maintenance on these terms.",
        ],
      },
    ],
  },
  {
    id: "usage",
    title: "Counting usage",
    status: { kind: "in-development" },
    paragraphs: [
      "The checker counts the organisations under usedBy in publiccode.yml. That is the declared number. An organisation counts as confirmed when it confirms this itself, or when a register names it as a user. Both numbers are shown.",
      "Every measurement stores the number, so the history shows whether use grows or shrinks. Usage gives no stars and no ranking. It only counts towards approval.",
    ],
  },
  {
    id: "checklist",
    title: "The checklist as a standard",
    paragraphs: [
      "What the checker measures decides which component is called suitable. Buyers, suppliers and municipalities act on it, so the checklist works as a standard. No single person or supplier decides what is in it. The community does, through a fixed and public process.",
    ],
    parts: [
      {
        title: "How the checklist changes",
        status: { kind: "proposed" },
        paragraphs: [
          "Propose. Anyone can propose a change: a new criterion, another threshold or another weight. This goes through an issue with a fixed template. The proposal says what changes, why, and which measured components pass or fail because of it.",
          "Consult. A proposal is open for comments for a fixed period, for example six weeks. The checker shows what the proposal does to the measured components.",
          "Decide. A management organisation decides on the content. Municipalities, suppliers, VNG and Developer Overheid sit in it. Every decision gets a public report: which comments came in and how they were weighed.",
          "Recognise. When the checklist is stable, it is put forward to the Forum Standaardisatie for the list 'pas toe of leg uit' (comply or explain). The Forum checks that the standard is open and well managed.",
        ],
      },
      {
        title: "Versions and a transition period",
        status: { kind: "in-development" },
        paragraphs: [
          "Every version of the checklist has a number, and every measurement records the version it was measured against. A new mandatory criterion or a stricter threshold gets a transition period. During that period the checker shows it as a warning, not as a fail. A component that is suitable stays suitable until the end of the transition period, so a maintainer has time to fix it.",
        ],
      },
    ],
  },
  {
    id: "governance",
    title: "Who decides on approval",
    paragraphs: [
      "Approval needs more than technology. It needs a governance decision: who approves, who sets the fix terms and the targets, and what happens when a maintainer does not meet them. This guide does not make that decision. It refers to it once it exists, and the checker shows the outcome.",
    ],
  },
];

export const PATH_DOC_SOURCES: DocSource[] = [
  {
    title: "The plan behind the checker (issue #54)",
    url: "https://github.com/Hugo-ter-Doest/CommonGroundChecker/issues/54",
  },
  {
    title: "publiccode.yml, the maintenance section",
    url: "https://publiccodeyml.github.io/v0/schema.core.html#section-maintenance",
  },
  { title: "CHAOSS metrics", url: "https://chaoss.community/kb-metrics-and-metrics-models/" },
  { title: "Forum Standaardisatie", url: "https://www.forumstandaardisatie.nl" },
];

/** Where the tools page explains the three kinds of result in more detail. */
export const THREE_SYSTEMS_HREF = `${TOOLS_DOC_HREF}#three-systems`;
