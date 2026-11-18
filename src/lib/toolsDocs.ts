import type { DocSource } from "./ratingDocs";

/** Path of the tools and models page in the rating guide. */
export const TOOLS_DOC_HREF = "/docs/tools-and-models";

/** Category pages of the rating guide that link to the tools and models page. */
export const TOOLS_DOC_LINKED_FROM = ["maintainability"];

/** One tool the checker uses for one measure. */
export interface ToolRow {
  measure: string;
  /** Which maintainability track uses the tool, "rated" for a criterion outside the tracks, or "information" when it is never counted */
  track: "open" | "estimate" | "both" | "rated" | "information";
  tool: string;
  version: string;
  licence: string;
  proves: string;
  doesNotProve: string;
  /** True while the part of the checker that uses the tool is still in review */
  inReview: boolean;
}

export interface ToolGroup {
  id: string;
  title: string;
  rows: ToolRow[];
}

/** One place where the checker deviates from the SIG/TÜV NORD model. */
export interface Deviation {
  topic: string;
  sig: string;
  checker: string;
  why: string;
}

/** A tool or model that was tested and not used for the purpose named. */
export interface RejectedTool {
  tool: string;
  consideredFor: string;
  reason: string;
}

export const TRACK_LABELS: Record<ToolRow["track"], string> = {
  open: "open track",
  estimate: "estimate track",
  both: "both tracks",
  rated: "counted in the rating",
  information: "information only",
};

const SOURCES = {
  guidance: {
    title: "SIG/TÜV NORD, Trusted Product Maintainability, guidance for producers v18.1 (PDF)",
    url: "https://softwareimprovementgroup.com/wp-content/uploads/SIG-TUViT-Evaluation-Criteria-Trusted-Product-Maintainability-Guidance-for-producers.pdf",
  },
  criteria: {
    title: "SIG/TÜV NORD, evaluation criteria Trusted Product Maintainability v18.0 (PDF)",
    url: "https://www.softwareimprovementgroup.com/wp-content/uploads/SIG-TUViT-Evaluation-Criteria-Trusted-Product-Maintainability.pdf",
  },
  sigrid2026: {
    title: "Sigrid 2026 model changes",
    url: "https://docs.sigrid-says.com/reference/quality-model-documents/2026-model-changes.html",
  },
  sigridExcludes: {
    title: "Sigrid default excludes",
    url: "https://github.com/Software-Improvement-Group/sigridci/blob/main/resources/default-excludes.txt",
  },
  heitlager: {
    title: "Heitlager, Kuipers and Visser (2007), A practical model for measuring maintainability (PDF)",
    url: "https://softwareimprovementgroup.com/wp-content/uploads/APracticalModelForMeasuringMaintainability.pdf",
  },
  alves2010: {
    title: "Alves, Ypma and Visser (2010), Deriving metric thresholds from benchmark data",
    url: "https://doi.org/10.1109/ICSM.2010.5609747",
  },
  alves2011: {
    title: "Alves, Correia and Visser (2011), Benchmark-based aggregation of metrics to ratings",
    url: "https://doi.org/10.1109/IWSM-MENSURA.2011.15",
  },
  openBenchmark: {
    title: "The open-track benchmark: repositories, measures, thresholds and how to regenerate them",
    url: "https://github.com/Hugo-ter-Doest/CommonGroundChecker/blob/main/scripts/open-benchmark/README.md",
  },
  qsm: {
    title: "QSM Function Point Languages Table, version 5.0",
    url: "https://www.qsm.com/resources/function-point-languages-table",
  },
  isbsg: {
    title: "ISBSG (2010), the impact of team size and software size on project delivery rate (PDF)",
    url: "https://isbsg.org/wp-content/uploads/2017/03/The-impact-of-team-size-and-software-size-on-project-delivery-rate-2010.pdf",
  },
  quamoco: {
    title: "Wagner et al., Operationalised product quality models and assessment: the Quamoco approach",
    url: "https://arxiv.org/abs/1611.09230",
  },
  chaoss: { title: "CHAOSS metrics", url: "https://chaoss.community/kb-metrics-and-metrics-models/" },
  lizard: { title: "lizard", url: "https://github.com/terryyin/lizard" },
  jscpd: { title: "jscpd", url: "https://github.com/kucherenko/jscpd" },
  simian: { title: "Simian", url: "https://github.com/quandarypeak/simian" },
  scc: { title: "scc", url: "https://github.com/boyter/scc" },
  pdepend: { title: "PHP Depend (pdepend)", url: "https://github.com/pdepend/pdepend" },
  grimp: { title: "grimp", url: "https://github.com/seddonym/grimp" },
  importLinter: { title: "import-linter", url: "https://github.com/seddonym/import-linter" },
  dependencyCruiser: { title: "dependency-cruiser", url: "https://github.com/sverweij/dependency-cruiser" },
  sonarqube: { title: "SonarQube Community Build", url: "https://github.com/SonarSource/sonarqube" },
  gitleaks: { title: "gitleaks", url: "https://github.com/gitleaks/gitleaks" },
  osv: { title: "OSV.dev", url: "https://osv.dev/" },
  scorecard: { title: "OpenSSF Scorecard", url: "https://scorecard.dev/" },
  criticality: { title: "OpenSSF Criticality Score", url: "https://github.com/ossf/criticality_score" },
  spectral: { title: "Spectral", url: "https://github.com/stoplightio/spectral" },
  codeMaat: { title: "code-maat", url: "https://github.com/adamtornhill/code-maat" },
  sloccount: { title: "SLOCCount", url: "https://dwheeler.com/sloccount/" },
} satisfies Record<string, DocSource>;

export const TWO_TRACKS: { id: "open" | "estimate"; title: string; paragraphs: string[] }[] = [
  {
    id: "open",
    title: "The open track",
    paragraphs: [
      "The open track uses only open-source tools and thresholds that anyone can check and regenerate. The thresholds come from a public benchmark of 60 Common Ground and Developer Overheid repositories, with the benchmark method of Alves et al. The benchmark list, the raw measures and the scripts are published with the checker.",
      "We need it for openness and reproducibility. Anyone can see why a component gets its stars, and anyone can measure again and get the same answer.",
      "The open track is not a SIG rating and does not predict one. It is shown next to the estimate, for information only (weight 0).",
    ],
  },
  {
    id: "estimate",
    title: "The estimate track",
    paragraphs: [
      "The estimate track is the closest open reproduction of the published SIG/TÜV NORD maintainability model: the guidance for producers v18.1 of 31 March 2026. It uses the same properties, the same scope rules and the published 4-star limits.",
      "We need it because SIG audits the components in the end. The estimate tells a supplier early where an audit is likely to land.",
      "The estimate is not calibrated against real SIG audits. There are no Sigrid results to compare with. It is checked against the published model v18.1 only.",
    ],
  },
];

export const WHY_BOTH =
  "Both tracks measure the same properties and add them up the same way. They differ in calibration: published open thresholds on one side, SIG's published 4-star limits on the other. So a gap between the two can be explained property by property. The checker shows them side by side and never presents the open rating as a SIG prediction.";

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "maintainability",
    title: "Maintainability",
    rows: [
      {
        measure: "Unit size, unit complexity and unit interfacing",
        track: "both",
        tool: "lizard",
        version: "1.24.3",
        licence: "MIT",
        proves:
          "The share of code in functions and methods that are long, have many branches (McCabe) or take many parameters, per language.",
        doesNotProve:
          "That the code is easy to read. McCabe counts branches, not meaning. lizard is not SIG's parser, so its unit boundaries can differ from a Sigrid scan.",
        inReview: false,
      },
      {
        measure: "Duplication",
        track: "estimate",
        tool: "the vendored estimate script's own clone count, cross-checked with jscpd",
        version: "jscpd 4.0.5",
        licence: "script EUPL-1.2, jscpd MIT",
        proves:
          "The share of redundant code lines: blocks of at least 6 code lines that are equal apart from whitespace, counted as copies minus one, per language. That is the v18.1 definition.",
        doesNotProve:
          "Copies with renamed identifiers, which count as 0. Whether comments are stripped the way SIG does it, which only a real Sigrid scan can settle.",
        inReview: false,
      },
      {
        measure: "Duplication cross-check",
        track: "estimate",
        tool: "Simian in strict mode, replacing jscpd 4.0.5",
        version: "4.2.1",
        licence: "Apache-2.0",
        proves:
          "A second, independent count of literal clones. On the six test repositories it landed in the same band as the estimate in 14 of 14 production cells.",
        doesNotProve: "Anything for Vue, which Simian cannot read. It never changes the rating.",
        inReview: true,
      },
      {
        measure: "Duplication",
        track: "open",
        tool: "jscpd, 6 lines, 30 tokens, weak mode, one run per language",
        version: "5.4.2",
        licence: "MIT",
        proves: "The share of duplicated lines as jscpd counts them, for every language the checker reads, Vue included.",
        doesNotProve:
          "SIG's duplication figure. jscpd finds token clones that can run into neighbouring lines, and it divides by all lines instead of code lines.",
        inReview: true,
      },
      {
        measure: "Module coupling, component independence and component entanglement",
        track: "estimate",
        tool: "the vendored estimate script's import graph (regular expressions over imports), for PHP, Python and, in review, JavaScript, TypeScript and Vue",
        version: "script at ConductionNL/.github cd0fe04",
        licence: "EUPL-1.2",
        proves:
          "How many files depend on each file, how much code is used from outside its component, and how many dependencies between components run in cycles.",
        doesNotProve:
          "Coupling at the level of calls: it counts dependencies, not invocations. The components come from our own directory rule, not from SIG.",
        inReview: false,
      },
      {
        measure: "Module coupling, component independence and component entanglement",
        track: "open",
        tool: "PHP: pdepend. Python: grimp, with import-linter for declared contracts. JavaScript, TypeScript and Vue: dependency-cruiser",
        version: "pdepend 3.0.0, grimp 3.18, import-linter 2.15, dependency-cruiser 17.4.3",
        licence: "pdepend BSD-3-Clause, grimp and import-linter BSD-2-Clause, dependency-cruiser MIT",
        proves: "The same properties as the estimate, from a dependency graph that a dedicated open-source tool resolved.",
        doesNotProve:
          "A rating. These measures have no calibrated thresholds yet, so the open track reports them as not calibrated.",
        inReview: true,
      },
      {
        measure: "Size",
        track: "both",
        tool: "scc on the production scope, never on the whole repository",
        version: "4.1.0",
        licence: "MIT",
        proves:
          "The lines of production code per language, and from them a rebuild effort: backfiring (QSM and ISBSG) for the open track, SIG v17.0 lines per person-year for the estimate.",
        doesNotProve: "Quality. Size is context only and has no stars.",
        inReview: true,
      },
      {
        measure: "Comparison with SonarQube",
        track: "information",
        tool: "an existing SonarQube server, read through its Web API. The checker never runs a scan.",
        version: "tested with Community Build 26.10",
        licence: "server LGPL-3.0, PHP, Python and JavaScript analyzers SONAR Source-Available License v1.0",
        proves: "What a project's own SonarQube reports: the technical debt ratio and the issues of four rules.",
        doesNotProve:
          "A rating. It is information only and never gives stars. The calibrated profile was fitted on six repositories.",
        inReview: true,
      },
      {
        measure: "Test code ratio",
        track: "rated",
        tool: "a line count of test code against production code in the cloned repository",
        version: "the checker's own",
        licence: "EUPL-1.2",
        proves: "How much test code there is next to the production code.",
        doesNotProve: "That the tests run, pass, or test anything that matters. It is a stand-in for coverage.",
        inReview: false,
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    rows: [
      {
        measure: "Vulnerabilities, dependency freshness, activity, licences and management",
        track: "rated",
        tool: "the vendored Open Source Health script, which reads the lockfiles and queries OSV.dev, Packagist, the npm registry and PyPI",
        version: "script at ConductionNL/.github 20cd81c",
        licence: "EUPL-1.2",
        proves:
          "Known vulnerabilities in the locked versions, how old those versions are, whether the dependencies still release, and their licence risk.",
        doesNotProve:
          "That there are no unknown vulnerabilities, or that a vulnerable function is ever called. Only the lockfiles at the repository root are read, and development dependencies are left out.",
        inReview: false,
      },
      {
        measure: "Secrets",
        track: "rated",
        tool: "gitleaks over the files of the repository",
        version: "8.30.1",
        licence: "MIT",
        proves: "That no file in the checked tree matches one of gitleaks' secret patterns.",
        doesNotProve:
          "That the git history is clean, or that a secret in a format gitleaks does not know is absent.",
        inReview: false,
      },
      {
        measure: "Secure coding",
        track: "rated",
        tool: "the checker's own pattern scan",
        version: "the checker's own",
        licence: "EUPL-1.2",
        proves: "Whether a fixed list of risky patterns appears in the source, such as dynamic code or switching off TLS verification.",
        doesNotProve: "That the code is secure. It is a heuristic, not a static analysis.",
        inReview: false,
      },
      {
        measure: "Supply chain",
        track: "rated",
        tool: "the public OpenSSF Scorecard API (GitHub repositories only), and a search for an SPDX or CycloneDX document",
        version: "the result Scorecard last published",
        licence: "Scorecard Apache-2.0",
        proves: "Practices such as branch protection, code review, pinned dependencies and signed releases, and that an SBOM file exists.",
        doesNotProve:
          "That a release is safe, or that the SBOM is complete. The Scorecard result can be older than the commit checked.",
        inReview: false,
      },
    ],
  },
  {
    id: "governance",
    title: "Governance",
    rows: [
      {
        measure: "Licensing",
        track: "rated",
        tool: "the licence the GitHub or GitLab API reports, a text match on the LICENSE file, and a scan for SPDX headers and REUSE files",
        version: "the checker's own",
        licence: "EUPL-1.2",
        proves: "Which licence the repository declares, whether every declaration names the same one, and how many files carry a header.",
        doesNotProve: "A legal review, or that the dependencies' licences are compatible. Those are rated under Security.",
        inReview: false,
      },
      {
        measure: "Project health",
        track: "information",
        tool: "six CHAOSS metrics, computed from the GitHub or GitLab API",
        version: "the checker's own",
        licence: "EUPL-1.2",
        proves: "How many people carry the project, from how many organisations, and how fast pull requests and issues get an answer.",
        doesNotProve: "Code quality. It is shown without stars and never counts in a rating.",
        inReview: true,
      },
      {
        measure: "Usage and ecosystem",
        track: "information",
        tool: "per source: publiccode.yml, the Nextcloud App Store, release and package downloads, Docker Hub, deps.dev, GitHub stars and forks",
        version: "the checker's own",
        licence: "EUPL-1.2",
        proves: "What each source reports, with its date.",
        doesNotProve:
          "Real use. Downloads include CI and mirrors, and many government installations show up in no public source. It is shown per source and never ranked.",
        inReview: true,
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    rows: [
      {
        measure: "NL API Design Rules",
        track: "rated",
        tool: "Spectral with the API Design Rules rule set of developer.overheid.nl",
        version: "6.17.0",
        licence: "Apache-2.0",
        proves: "That the OpenAPI document follows the rules of the rule set.",
        doesNotProve: "That the running API behaves like its document.",
        inReview: false,
      },
    ],
  },
];

export const DEVIATIONS: Deviation[] = [
  {
    topic: "Benchmark",
    sig: "SIG calibrates its thresholds on a private benchmark of the systems it has measured.",
    checker:
      "The open track uses its own public benchmark of 60 repositories, with the method of Alves et al. The estimate uses SIG's published 4-star limits. The 5, 3 and 2-star limits of the estimate are derived by the checker.",
    why: "SIG's benchmark is not public, and only its 4-star limits are published.",
  },
  {
    topic: "Volume",
    sig: "Volume was removed from the maintainability rating in v18.0. Sigrid still shows person-years as context.",
    checker:
      "Size is shown as context only, with no stars. For the SIG-style person-years, PHP, Vue, HTML, CSS and SQL use the JavaScript factor of v17.0 as a proxy.",
    why:
      "SIG never published a factor for those languages. The JavaScript factor is the proxy; with the Python factor, OpenRegister would read 82.1 person-years instead of 59.7.",
  },
  {
    topic: "Duplication",
    sig: "SIG uses its own clone detector, which is not published.",
    checker:
      "The estimate reproduces the v18.1 definition itself: 6 code lines, equal apart from whitespace, copies minus one. The open track uses jscpd 5 and labels its figure as jscpd duplicated lines.",
    why:
      "jscpd is the only open candidate that reads Vue, and Vue is 30% of OpenCatalogi's production code. Its definition differs, so its figure is never shown as SIG's.",
  },
  {
    topic: "Module coupling",
    sig: "v18.1 counts incoming dependencies, such as invocations.",
    checker: "The checker counts the distinct files that depend on a file. That can only count fewer, never more.",
    why: "There is no open, reproducible call graph for PHP, Python and JavaScript together.",
  },
  {
    topic: "Component entanglement",
    sig: "v18.1 combines density and violation degree, each normalised by a benchmark maximum, and sets 4 stars at 0.075.",
    checker: "The checker compares the raw violation degree with 0.075.",
    why: "SIG's normalisation is not published, so this star is a proxy.",
  },
  {
    topic: "Components",
    sig: "SIG picks the components of a system from a knowledge base it does not publish.",
    checker:
      "The checker descends from the root while one directory holds more than 80% of the files, and takes the directories below as components. The rule is printed next to the numbers.",
    why: "It is the only rule we can publish. Component independence is where a real audit is likely to differ most.",
  },
  {
    topic: "Tools",
    sig: "SIG measures with its own, proprietary analysers.",
    checker:
      "The checker uses only open-source tools. SonarQube is read only as an outside comparison, and never feeds a rating.",
    why: "Anyone must be able to run the same measurement and get the same numbers.",
  },
  {
    topic: "Languages in the open track",
    sig: "SIG rates duplication per language, and 4 stars needs every language within the limit.",
    checker: "The open track pools all languages of a repository.",
    why:
      "A benchmark of 60 repositories is too small to calibrate each language apart. The estimate keeps SIG's per-language rule.",
  },
  {
    topic: "Scope",
    sig: "Sigrid leaves out generated and third-party code, migrations and tests, through its default excludes.",
    checker:
      "The checker follows those default excludes exactly, including .*/contrib/.*, and a repository's own sigrid.yaml.",
    why:
      "That is how an audit would scope the code. The cost is visible: on Open Forms the contrib rule drops 19,533 lines of its own plugin code.",
  },
];

export const REJECTED_TOOLS: RejectedTool[] = [
  {
    tool: "Quamoco",
    consideredFor: "an open quality model",
    reason:
      "The tooling is dead: the original repository was archived in 2018 without a licence file, and its models cover Java and C# only.",
  },
  {
    tool: "Maintainability Index (radon, PhpMetrics, escomplex)",
    consideredFor: "an open maintainability score",
    reason:
      "The three tools use three scales that do not compare, and adding comments raises the score. It does not track SIG: radon's per-file medians are 95 to 100 on three Python repositories that the estimate rates 2.5 to 3.2.",
  },
  {
    tool: "code-maat",
    consideredFor: "a rating from change history",
    reason:
      "Hotspots and change coupling help decide where to look first, but they are not a rating and have no SIG counterpart. It needs the full history and took 4.46 GB on OpenRegister.",
  },
  {
    tool: "COCOMO and SLOCCount",
    consideredFor: "size and rebuild effort",
    reason:
      "COCOMO comes out 2.5 to 4.3 times higher than the SIG-style figure; on the whole repository, scc's COCOMO gives OpenRegister 1,050 person-years. SLOCCount is unmaintained since 2004 and cannot read Vue or TypeScript, so it misses 55% of OpenCatalogi.",
  },
  {
    tool: "OpenSSF Criticality Score",
    consideredFor: "project health",
    reason:
      "Its issue signals returned 0 for all six test repositories, while GitHub found 56 closed issues for Open Zaak in the same 90 days. It counts every tag as a release, and it measures how critical a project is as a dependency, not its quality.",
  },
  {
    tool: "SonarQube",
    consideredFor: "the open track",
    reason:
      "Its PHP, Python and JavaScript analyzers are source-available, not open source. With the default profile it rated all six test repositories A. It needs 4 GB for the server and 6 GB for the scanner, and 26 minutes on OpenRegister. It stays as an optional outside comparison only.",
  },
  {
    tool: "jscpd 4.0.5",
    consideredFor: "the estimate's duplication cross-check",
    reason:
      "It counted 2 to 5 times fewer duplicated lines, took 334 s on OpenRegister and ran out of memory on its tests. Simian 4.2.1 replaces it (in review). Simian itself was not rejected.",
  },
  {
    tool: "PMD CPD",
    consideredFor: "duplication",
    reason: "It ran out of memory on OpenRegister's PHP at 5.9 and 7 GB of heap, and it cannot read Vue.",
  },
  {
    tool: "PhpMetrics",
    consideredFor: "the PHP dependency graph",
    reason: "It misses Foo::class references. On OpenCatalogi that is 44 of 108 edges.",
  },
  {
    tool: "pyan3",
    consideredFor: "the Python dependency graph",
    reason: "It resolves calls by name and invents edges: 57% of uses stay unresolved, and 67 to 73% of its edges are not imports.",
  },
  {
    tool: "emerge",
    consideredFor: "one dependency tool for every language",
    reason: "It has no PHP and no Vue parser.",
  },
  {
    tool: "GrimoireLab and CollectOSS",
    consideredFor: "project health",
    reason: "Both are long-running collectors that need several services and databases, not a check that runs on demand.",
  },
];

export const LIMITS: string[] = [
  "The estimate track is not calibrated against real SIG audits. There are no Sigrid results to compare with. It is checked against the published model v18.1 only, and only the 4-star limits in it are published.",
  "The open-track thresholds come from one benchmark of 60 public repositories, measured on 18 November 2026. At most 12 repositories per owner count. Module coupling and the component properties are not calibrated yet.",
  "The star limits of the open track are our reading of the 2011 calibration method. They are not a copy of SIG's algorithm.",
  "The tools were compared on six repositories: OpenRegister, OpenCatalogi, Open Zaak, Open Forms, plugin-pdc-base and Objects API. The SonarQube profile was fitted on the same six. It orders them like the estimate (Spearman 0.94), but six repositories are too few to trust that order elsewhere.",
  "Tool versions are pinned, because a new version can change the numbers. A version bump needs a new benchmark run.",
];

export const TOOLS_DOC_SOURCES: DocSource[] = Object.values(SOURCES);
