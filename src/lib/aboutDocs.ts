import { PATH_DOC_HREF, PATH_SECTIONS, type PathStatus } from "./pathDocs";

/** The plan behind the checker, kept in issue #54. */
export const PLAN_ISSUE_URL = "https://github.com/Hugo-ter-Doest/CommonGroundChecker/issues/54";

export interface PlanPoint {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  status?: PathStatus;
  link: { href: string; text: string };
}

function pathSection(id: string) {
  const section = PATH_SECTIONS.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`no path section ${id}`);
  return section;
}

function pathLink(id: string) {
  return { href: `${PATH_DOC_HREF}#${id}`, text: `More on the path page: ${pathSection(id).title.toLowerCase()}` };
}

/** A short overview of the plan. The path page holds the detail. */
export const PLAN_POINTS: PlanPoint[] = [
  {
    id: "goal-open-space",
    title: "Goal 1: an open space for components",
    paragraphs: [
      "Every organisation can offer its components, and everyone can see them. That shows where initiatives build the same thing, so organisations that work on the same thing find each other. The only condition is that the repository is public.",
      "We want Common Ground and the aspects the checker rates to become part of developer.overheid.nl, together with Developer Overheid. We do not build a catalogue of our own. The checker measures, and the register shows the measurements.",
    ],
    link: { href: PLAN_ISSUE_URL, text: "The plan behind the checker (issue #54)" },
  },
  {
    id: "goal-better-code",
    title: "Goal 2: helping developers improve their code",
    paragraphs: [
      "The checker gives developers tools on five aspects: repository setup, deployability on Haven, code quality, security and architecture. The tools and the results are both open. A developer sees what to work on, and a buyer sees what they take on. A rating is advice, not a condition for being listed.",
    ],
    link: { href: PLAN_ISSUE_URL, text: "The plan behind the checker (issue #54)" },
  },
  {
    id: "three-systems",
    title: pathSection("three-systems").title,
    paragraphs: ["The checker reports three different things. They answer different questions."],
    items: pathSection("three-systems").items,
    status: pathSection("three-systems").status,
    link: pathLink("three-systems"),
  },
  {
    id: "levels",
    title: pathSection("levels").title,
    paragraphs: [
      "Suitable for Common Ground means the checker finds that the component meets the technical conditions, including a valid maintenance contract. Approved adds that the software is stable, that at least two organisations are listed as users under usedBy in publiccode.yml, and that VNG has an SLA with a maintainer. The number two is a proposal.",
    ],
    status: pathSection("levels").status,
    link: pathLink("levels"),
  },
  {
    id: "maintenance",
    title: pathSection("maintenance").title,
    paragraphs: [
      "A maintainer keeps a component at the level the checker measures. Maintenance has three parts: hard criteria that keep passing, KPIs with a target, and fixing bugs. New development is agreed separately.",
    ],
    status: pathSection("maintenance").status,
    link: pathLink("maintenance"),
  },
  {
    id: "checklist",
    title: pathSection("checklist").title,
    paragraphs: [
      "What the checker measures decides which component is called suitable, so the checklist works as a standard. The community decides what is in it, through a public process: propose, consult, decide and, once stable, ask the Forum Standaardisatie to recognise it. Every version has a number.",
    ],
    status: pathSection("checklist").status,
    link: pathLink("checklist"),
  },
  {
    id: "code-overheid",
    title: "A home at code.overheid.nl",
    paragraphs: [
      "Both goals are about trust between governments, so the checker belongs with the government and not on a personal account. code.overheid.nl is the code platform for Dutch government organisations. The community decides whether the checker moves there and who owns it.",
    ],
    status: { kind: "proposed" },
    link: { href: "https://code.overheid.nl", text: "code.overheid.nl" },
  },
];

export interface LifecycleState {
  id: string;
  name: string;
  text: string;
  /** Left out when the checker shows the state already */
  status?: PathStatus;
}

export interface LifecycleTransition {
  /** "any" stands for every other state */
  from: string;
  to: string;
  /** A few words, drawn next to the arrow */
  label: string;
  /** The full condition, for the table */
  text: string;
}

/** The status of a component in the Common Ground programme. */
export const CG_STATES: LifecycleState[] = [
  { id: "listed", name: "Listed", text: "A public repository is in the space of goal 1. Anyone can add one." },
  { id: "measured", name: "Measured", text: "The checker measures it, every night for followed components." },
  {
    id: "suitable",
    name: "Suitable for Common Ground",
    text: "The verdict holds: no mandatory criterion fails, the overall rating is at least 2.5, there is a valid maintenance contract, and the maintainability estimate is at least 4 stars.",
    status: pathSection("verdict").status,
  },
  {
    id: "approved",
    name: "Approved",
    text: "Suitable, developmentStatus stable, at least two users listed under usedBy in publiccode.yml, and an SLA from VNG with a maintainer. The number two is a proposal. The component is in the support of the programme.",
    status: { kind: "in-development" },
  },
  {
    id: "in-remedy",
    name: "In remedy",
    text: "An approved component drops below a criterion. The fix term runs, and the component stays approved during the term.",
    status: { kind: "in-development" },
  },
  {
    id: "out-of-support",
    name: "Out of support",
    text: "The fix term passed, the SLA ended or was not renewed, there are fewer users than required, or the software is no longer stable. The component can come back.",
    status: { kind: "proposed" },
  },
  {
    id: "retired",
    name: "Retired",
    text: "The component is obsolete, or the programme retires it. Its history stays visible.",
    status: { kind: "proposed" },
  },
];

export const CG_TRANSITIONS: LifecycleTransition[] = [
  { from: "listed", to: "measured", label: "measured", text: "The checker measures the component." },
  { from: "measured", to: "suitable", label: "verdict holds", text: "The verdict holds." },
  { from: "suitable", to: "measured", label: "verdict lost", text: "The verdict no longer holds." },
  {
    from: "suitable",
    to: "approved",
    label: "stable, 2 users + SLA",
    text: "The software is stable, at least two organisations are listed as users under usedBy, and VNG agrees an SLA with a maintainer.",
  },
  {
    from: "approved",
    to: "in-remedy",
    label: "criterion fails",
    text: "The component drops below a criterion. The fix term starts.",
  },
  { from: "in-remedy", to: "approved", label: "fixed in time", text: "The maintainer fixes it within the fix term." },
  { from: "in-remedy", to: "out-of-support", label: "term passed", text: "The fix term passed without a fix." },
  {
    from: "approved",
    to: "out-of-support",
    label: "no SLA, too few users or not stable",
    text: "The SLA ended or was not renewed, fewer organisations are listed as users than required, or developmentStatus went back from stable to beta, development or concept.",
  },
  {
    from: "out-of-support",
    to: "approved",
    label: "suitable, stable + new SLA",
    text: "The component is suitable and stable again, and has a new SLA.",
  },
  {
    from: "any",
    to: "retired",
    label: "obsolete or retired",
    text: "developmentStatus becomes obsolete, or the programme retires the component.",
  },
];

/** The developmentStatus values of publiccode.yml, in order. The maintainer sets them. */
export const COMPONENT_STATES: LifecycleState[] = [
  { id: "concept", name: "concept", text: "Only the idea exists." },
  { id: "development", name: "development", text: "The software is being built." },
  { id: "beta", name: "beta", text: "The software is being tested." },
  { id: "stable", name: "stable", text: "The software is ready for use." },
  { id: "obsolete", name: "obsolete", text: "The software is no longer maintained or has been replaced." },
];

/** How a developmentStatus relates to the Common Ground lifecycle. */
export const LIFECYCLE_RELATION: { statuses: string[]; effect: string }[] = [
  {
    statuses: ["concept", "development", "beta"],
    effect: "Can be listed, measured and suitable for Common Ground. Cannot be approved.",
  },
  {
    statuses: ["stable"],
    effect: "Can be in any state of the Common Ground lifecycle. Only a stable component can be approved. A stable component can still be out of support.",
  },
  { statuses: ["obsolete"], effect: "Leads to retired. The history stays visible." },
];

/** What happens to an approved component whose developmentStatus leaves stable. */
export const LEAVING_STABLE: { to: string[]; state: string }[] = [
  { to: ["beta", "development", "concept"], state: "out-of-support" },
  { to: ["obsolete"], state: "retired" },
];

export function stateName(id: string): string {
  if (id === "any") return "Any state";
  const state = CG_STATES.find((candidate) => candidate.id === id);
  if (!state) throw new Error(`no lifecycle state ${id}`);
  return state.name;
}
