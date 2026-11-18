import { githubApiHeaders } from "../github";
import type { RepoContext, RepositoryMeta } from "../providers/types";
import type { CheckResult, PublicCodeData, UsageFigure, UsageSource, UsageSourceKind } from "../types";
import { USAGE_CHECK_ID, describeUsageSource, shownUsageSources } from "../usage";

type FetchFn = typeof fetch;

export interface UsageOptions {
  /** Image locations given with the check */
  dockerLocations?: string[];
  fetchFn?: FetchFn;
  now?: Date;
}

/** The packages a repository publishes, read from its own manifests. */
export interface DetectedPackages {
  npm: string | null;
  packagist: string | null;
  pypi: string | null;
  nextcloudApp: string | null;
}

export interface DetectedImages {
  dockerHub: string[];
  ghcr: string[];
}

const TIMEOUT_MS = 10_000;
/** The App Store only publishes its catalogue as one file of about 14 MB. */
const APP_STORE_TIMEOUT_MS = 30_000;
const GITHUB_API = "https://api.github.com";
const MAX_RELEASE_PAGES = 5;
/** At most 1,000 commits are read for the contributor count. */
const MAX_COMMIT_PAGES = 10;

const MANIFEST_PATHS = ["package.json", "composer.json", "pyproject.toml", "setup.cfg", "setup.py", "appinfo/info.xml"];

class NotFound extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function figures(entries: Array<[label: string, value: unknown]>): UsageFigure[] {
  return entries.flatMap(([label, value]) => {
    const count = numberOrNull(value);
    return count === null ? [] : [{ label, value: count }];
  });
}

/** "github.com/owner/repo" for the URL forms package registries use, lower case; null for anything else. */
export function normaliseRepositoryUrl(url: string): string | null {
  const match = url
    .trim()
    .replace(/^git\+/, "")
    .replace(/^git@([^:]+):/, "https://$1/")
    .match(/^(?:[a-z]+:\/\/)?(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+?)(?:\.git)?\/?(?:[#?].*)?$/i);
  if (!match) return null;
  const segments = match[2].split("/").filter(Boolean);
  if (segments.length < 2) return null;
  return `${match[1]}/${segments.slice(0, 2).join("/")}`.toLowerCase();
}

function repositoryKey(context: RepoContext): string {
  return `${context.provider.hostname}/${context.projectPath}`.toLowerCase();
}

/** True when one of the URLs a registry gives for a package points at this repository. */
export function pointsAtRepository(urls: unknown[], context: RepoContext): boolean {
  const key = repositoryKey(context);
  return urls.some((url) => typeof url === "string" && normaliseRepositoryUrl(url) === key);
}

function tomlSectionName(content: string, section: string): string | null {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${section}]`);
  if (start === -1) return null;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*\[/.test(line)) return null;
    const match = line.match(/^\s*name\s*=\s*["']([^"']+)["']/);
    if (match) return match[1].trim();
  }
  return null;
}

function iniName(content: string): string | null {
  const metadata = content.split(/^\s*\[metadata\]\s*$/m)[1];
  return metadata?.split(/^\s*\[/m)[0].match(/^\s*name\s*=\s*([^\s#;]+)/m)?.[1] ?? null;
}

/** Package names from the repository's manifests; a private npm package has none. */
export function detectPackages(files: Record<string, string | null>): DetectedPackages {
  let npm: string | null = null;
  let packagist: string | null = null;
  try {
    const manifest = JSON.parse(files["package.json"] ?? "null");
    if (isRecord(manifest) && manifest.private !== true && typeof manifest.name === "string") npm = manifest.name;
  } catch {
    npm = null;
  }
  try {
    const manifest = JSON.parse(files["composer.json"] ?? "null");
    if (isRecord(manifest) && typeof manifest.name === "string" && manifest.name.includes("/")) {
      packagist = manifest.name.toLowerCase();
    }
  } catch {
    packagist = null;
  }

  const pyproject = files["pyproject.toml"] ?? "";
  const pypi =
    tomlSectionName(pyproject, "project") ??
    tomlSectionName(pyproject, "tool.poetry") ??
    iniName(files["setup.cfg"] ?? "") ??
    (files["setup.py"] ?? "").match(/\bname\s*=\s*["']([^"']+)["']/)?.[1] ??
    null;

  const nextcloudApp = (files["appinfo/info.xml"] ?? "").match(/<id>\s*([a-z0-9_]+)\s*<\/id>/)?.[1] ?? null;
  return { npm, packagist, pypi, nextcloudApp };
}

function looseName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Container images on Docker Hub and GHCR. An image given with the check always
 * counts; one named in the repository's texts only when its namespace or name
 * is the repository's owner or name, so that images it merely uses are left out.
 */
export function detectImages(texts: string[], dockerLocations: string[], owner: string, repo: string): DetectedImages {
  const dockerHub = new Set<string>();
  const ghcr = new Set<string>();
  const ours = (namespace: string, name: string) =>
    looseName(namespace) === looseName(owner) || looseName(name) === looseName(repo);

  const scan = (text: string, given: boolean) => {
    const hubPatterns = [
      /hub\.docker\.com\/r\/([\w.-]+)\/([\w.-]+)/gi,
      /hub\.docker\.com\/repository\/docker\/([\w.-]+)\/([\w.-]+)/gi,
      /\bdocker\.io\/([\w.-]+)\/([\w.-]+)/gi,
    ];
    for (const pattern of hubPatterns) {
      for (const [, namespace, name] of text.matchAll(pattern)) {
        if (namespace.toLowerCase() !== "library" && (given || ours(namespace, name))) {
          dockerHub.add(`${namespace}/${name}`.toLowerCase());
        }
      }
    }
    for (const [, namespace, name] of text.matchAll(/\bghcr\.io\/([\w.-]+)\/([\w.-]+)/gi)) {
      if (given || ours(namespace, name)) ghcr.add(`${namespace}/${name}`.toLowerCase());
    }
  };

  for (const location of dockerLocations) {
    const value = location.trim();
    if (/^[\w.-]+\/[\w.-]+$/.test(value)) dockerHub.add(value.toLowerCase());
    else scan(value, true);
  }
  for (const text of texts) scan(text, false);
  return { dockerHub: [...dockerHub], ghcr: [...ghcr] };
}

function failureReason(error: unknown): string {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "no answer in time";
  }
  return error instanceof Error ? error.message : "request failed";
}

async function getJson(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = TIMEOUT_MS
): Promise<unknown> {
  const response = await fetchFn(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status === 404) throw new NotFound(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

interface SourceBase {
  id: string;
  kind: UsageSourceKind;
  source: string;
  subject: string | null;
  url: string | null;
  caveat: string;
}

/**
 * Measures one source. A source that does not know the subject is left out
 * (null); any other failure is shown as not measured with its reason.
 */
async function measure(
  base: SourceBase,
  measuredAt: string,
  run: () => Promise<{ figures: UsageFigure[]; names?: string[]; subject?: string; caveat?: string } | null>
): Promise<UsageSource | null> {
  try {
    const measured = await run();
    if (!measured) return null;
    const { subject, caveat, ...rest } = measured;
    return { ...base, subject: subject ?? base.subject, caveat: caveat ?? base.caveat, measuredAt, ...rest };
  } catch (error) {
    if (error instanceof NotFound) return null;
    return { ...base, measuredAt, figures: [], notMeasured: failureReason(error) };
  }
}

function npmSource(fetchFn: FetchFn, name: string, context: RepoContext, measuredAt: string) {
  return measure(
    {
      id: "npm",
      kind: "downloads",
      source: "npm",
      subject: name,
      url: `https://www.npmjs.com/package/${name}`,
      caveat: "Counts every download of the package, including CI builds and mirrors, not installations.",
    },
    measuredAt,
    async () => {
      const latest = await getJson(fetchFn, `https://registry.npmjs.org/${name.replace("/", "%2F")}/latest`);
      const repository = isRecord(latest) ? latest.repository : null;
      const repositoryUrl = isRecord(repository) ? repository.url : repository;
      if (!pointsAtRepository([repositoryUrl], context)) return null;
      const downloads = await getJson(fetchFn, `https://api.npmjs.org/downloads/point/last-month/${name}`);
      return { figures: figures([["downloads in the last month", isRecord(downloads) ? downloads.downloads : null]]) };
    }
  );
}

function packagistSource(fetchFn: FetchFn, name: string, context: RepoContext, measuredAt: string) {
  return measure(
    {
      id: "packagist",
      kind: "downloads",
      source: "Packagist",
      subject: name,
      url: `https://packagist.org/packages/${name}`,
      caveat: "Counts Composer installs, including CI builds; dependent packages are other packages on Packagist.",
    },
    measuredAt,
    async () => {
      const data = await getJson(fetchFn, `https://packagist.org/packages/${name}.json`);
      const pkg = isRecord(data) && isRecord(data.package) ? data.package : null;
      if (!pkg || !pointsAtRepository([pkg.repository], context)) return null;
      const downloads = isRecord(pkg.downloads) ? pkg.downloads : {};
      return {
        figures: figures([
          ["downloads in total", downloads.total],
          ["downloads in the last 30 days", downloads.monthly],
          ["dependent packages", pkg.dependents],
        ]),
      };
    }
  );
}

function pypiSource(fetchFn: FetchFn, name: string, context: RepoContext, measuredAt: string) {
  return measure(
    {
      id: "pypi",
      kind: "downloads",
      source: "PyPI (pypistats.org)",
      subject: name,
      url: `https://pypi.org/project/${name}/`,
      caveat: "Counts every download of the package, including CI builds and mirrors, not installations.",
    },
    measuredAt,
    async () => {
      const data = await getJson(fetchFn, `https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
      const info = isRecord(data) && isRecord(data.info) ? data.info : {};
      const urls = [info.home_page, ...(isRecord(info.project_urls) ? Object.values(info.project_urls) : [])];
      if (!pointsAtRepository(urls, context)) return null;
      const stats = await getJson(fetchFn, `https://pypistats.org/api/packages/${name.toLowerCase()}/recent`);
      const recent = isRecord(stats) && isRecord(stats.data) ? stats.data : {};
      return { figures: figures([["downloads in the last month", recent.last_month]]) };
    }
  );
}

function appStoreSource(fetchFn: FetchFn, appId: string, measuredAt: string) {
  return measure(
    {
      id: "nextcloud-appstore",
      kind: "downloads",
      source: "Nextcloud App Store",
      subject: appId,
      url: `https://apps.nextcloud.com/apps/${appId}`,
      caveat:
        "The App Store publishes no download count; installs from it download the GitHub release files, counted under GitHub releases.",
    },
    measuredAt,
    async () => {
      const apps = await getJson(fetchFn, "https://apps.nextcloud.com/api/v1/apps.json", {}, APP_STORE_TIMEOUT_MS);
      const app = Array.isArray(apps) ? apps.find((entry) => isRecord(entry) && entry.id === appId) : undefined;
      if (!isRecord(app)) return null;
      return { figures: figures([["ratings given", app.ratingNumOverall]]) };
    }
  );
}

async function githubPages(
  fetchFn: FetchFn,
  path: string,
  maxPages: number
): Promise<{ items: Record<string, unknown>[]; complete: boolean }> {
  const items: Record<string, unknown>[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await getJson(fetchFn, `${GITHUB_API}${path}${separator}per_page=100&page=${page}`, githubApiHeaders());
    const batch = Array.isArray(data) ? data.filter(isRecord) : [];
    items.push(...batch);
    if (batch.length < 100) return { items, complete: true };
  }
  return { items, complete: false };
}

function releaseSource(fetchFn: FetchFn, context: RepoContext, measuredAt: string) {
  return measure(
    {
      id: "github-releases",
      kind: "downloads",
      source: "GitHub releases",
      subject: null,
      url: `https://github.com/${context.projectPath}/releases`,
      caveat:
        "Counts every download of a release file, including App Store installs and updates, CI jobs and mirrors.",
    },
    measuredAt,
    async () => {
      const { items, complete } = await githubPages(fetchFn, `/repos/${context.projectPath}/releases`, MAX_RELEASE_PAGES);
      const withFiles = items.filter((release) => Array.isArray(release.assets) && release.assets.length > 0);
      if (withFiles.length === 0) return null;
      const downloads = withFiles
        .flatMap((release) => release.assets as unknown[])
        .reduce<number>((sum, asset) => sum + (isRecord(asset) ? (numberOrNull(asset.download_count) ?? 0) : 0), 0);
      return {
        figures: [
          { label: "release file downloads", value: downloads },
          { label: complete ? "releases with files" : "most recent releases with files", value: withFiles.length },
        ],
      };
    }
  );
}

function dockerHubSource(fetchFn: FetchFn, image: string, measuredAt: string) {
  return measure(
    {
      id: `dockerhub:${image}`,
      kind: "containers",
      source: "Docker Hub",
      subject: image,
      url: `https://hub.docker.com/r/${image}`,
      caveat: "Counts every pull since the image was published, including CI pulls and automatic updates.",
    },
    measuredAt,
    async () => {
      const data = await getJson(fetchFn, `https://hub.docker.com/v2/repositories/${image}/`);
      return { figures: figures([["pulls in total", isRecord(data) ? data.pull_count : null]]) };
    }
  );
}

function ghcrSource(image: string, measuredAt: string): UsageSource {
  const [namespace, name] = image.split("/");
  return {
    id: `ghcr:${image}`,
    kind: "containers",
    source: "GitHub Container Registry",
    subject: image,
    url: `https://github.com/orgs/${namespace}/packages/container/package/${name}`,
    measuredAt,
    caveat: "Pull counts would include CI pulls.",
    figures: [],
    notMeasured: "GitHub publishes no pull count for container images through its API",
  };
}

function depsDevSource(fetchFn: FetchFn, system: "npm" | "pypi", name: string, measuredAt: string) {
  return measure(
    {
      id: `depsdev:${system}`,
      kind: "ecosystem",
      source: "deps.dev",
      subject: name,
      url: `https://deps.dev/${system}/${encodeURIComponent(name)}`,
      caveat: `Other ${system === "npm" ? "npm" : "PyPI"} packages that depend on the default version; says nothing about deployments.`,
    },
    measuredAt,
    async () => {
      const encoded = encodeURIComponent(name);
      const pkg = await getJson(fetchFn, `https://api.deps.dev/v3/systems/${system}/packages/${encoded}`);
      const versions = isRecord(pkg) && Array.isArray(pkg.versions) ? pkg.versions.filter(isRecord) : [];
      const key = versions.find((version) => version.isDefault === true)?.versionKey;
      const version = isRecord(key) && typeof key.version === "string" ? key.version : null;
      if (!version) return null;
      const dependents = await getJson(
        fetchFn,
        `https://api.deps.dev/v3alpha/systems/${system}/packages/${encoded}/versions/${encodeURIComponent(version)}:dependents`
      );
      const counts = isRecord(dependents) ? dependents : {};
      return {
        subject: `${name}@${version}`,
        figures: figures([
          ["dependent packages", counts.dependentCount],
          ["of which depend on it directly", counts.directDependentCount],
        ]),
      };
    }
  );
}

function repositorySource(context: RepoContext, meta: RepositoryMeta, measuredAt: string): UsageSource | null {
  const counts = figures([
    ["stars", meta.stargazers_count ?? meta.star_count],
    ["forks", meta.forks_count],
    ["watchers", meta.subscribers_count],
  ]);
  if (counts.length === 0) return null;
  return {
    id: "repository",
    kind: "ecosystem",
    source: context.provider.id === "github" ? "GitHub" : context.provider.hostname,
    subject: context.projectPath,
    url: context.repoUrl,
    measuredAt,
    caveat: "Stars and watchers measure attention, not use; forks include personal copies.",
    figures: counts,
  };
}

/** Mail providers whose addresses say nothing about an organisation; the same list as the CHAOSS check. */
const PERSONAL_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "live.nl",
  "hotmail.nl",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "posteo.de",
  "mailbox.org",
  "fastmail.com",
  "ziggo.nl",
  "kpnmail.nl",
  "planet.nl",
  "xs4all.nl",
  "home.nl",
  "telfort.nl",
]);

const BOT_NAME = /\[bot\]$|(^|[-_.])bot$|^ghost$/i;

/** The domain of an email address or the host of a URL, in lower case without "www.", or null. */
export function domainOf(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim().toLowerCase();
  if (text.includes("@") && !text.includes("/")) return text.slice(text.lastIndexOf("@") + 1) || null;
  try {
    return new URL(/^[a-z]+:\/\//.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function isUnknownDomain(domain: string): boolean {
  return (
    !domain.includes(".") ||
    PERSONAL_MAIL_DOMAINS.has(domain) ||
    domain === "localhost" ||
    /(^|\.)noreply\.|^noreply\b|(^|\.)local$|(^|\.)localdomain$/.test(domain)
  );
}

/** One commit as the contributor count sees it; the email is only read while counting. */
export interface CommitAuthor {
  email: string | null;
  bot: boolean;
}

export interface ContributorCounts {
  total: number;
  inside: number;
  other: number;
  unknown: number;
  /** Inside domains that at least two authors share, so naming them names no one */
  insideDomains: string[];
}

/**
 * Sorts commit authors, told apart by email address, into the owning
 * organisation, other organisations and unknown. Inside are the given domains
 * (with their subdomains) and the organisation domain with the most authors.
 * Personal, hidden and noreply addresses are unknown. Only counts leave this function.
 */
export function classifyContributors(commits: CommitAuthor[], ownerDomains: string[]): ContributorCounts {
  const authors = new Map<string, string | null>();
  for (const commit of commits) {
    if (commit.bot || !commit.email) continue;
    const email = commit.email.trim().toLowerCase();
    if (!authors.has(email)) authors.set(email, /^no-?reply@/.test(email) ? null : domainOf(email));
  }

  const authorsPerDomain = new Map<string, number>();
  for (const domain of authors.values()) {
    if (domain && !isUnknownDomain(domain)) authorsPerDomain.set(domain, (authorsPerDomain.get(domain) ?? 0) + 1);
  }
  const dominant = [...authorsPerDomain.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const owners = [...new Set([...ownerDomains, ...(dominant ? [dominant] : [])])];
  const isInside = (domain: string) => owners.some((owner) => domain === owner || domain.endsWith(`.${owner}`));

  const counts: ContributorCounts = { total: authors.size, inside: 0, other: 0, unknown: 0, insideDomains: [] };
  const insideAuthors = new Map<string, number>();
  for (const domain of authors.values()) {
    if (!domain || isUnknownDomain(domain)) counts.unknown += 1;
    else if (isInside(domain)) {
      counts.inside += 1;
      insideAuthors.set(domain, (insideAuthors.get(domain) ?? 0) + 1);
    } else counts.other += 1;
  }
  counts.insideDomains = [...insideAuthors.entries()].filter(([, count]) => count >= 2).map(([domain]) => domain).sort();
  return counts;
}

/** Domains publiccode.yml gives for the owner: maintenance contacts and contractors, and the organisation. */
export function ownerDomainsFromPublicCode(publiccode: PublicCodeData | undefined): string[] {
  if (!publiccode) return [];
  const values = [
    ...publiccode.maintenance.contacts.map((contact) => contact.email),
    ...publiccode.maintenance.contractors.flatMap((contractor) => [contractor.email, contractor.website]),
    publiccode.organisation?.uri,
  ];
  return [...new Set(values.map(domainOf).filter((domain): domain is string => !!domain && !isUnknownDomain(domain)))];
}

const COMMIT_WINDOW_DAYS = 365;

/** Commit authors of the last 12 months, counted by organisation; no address, name or domain of one person is kept. */
function contributorSource(
  fetchFn: FetchFn,
  context: RepoContext,
  publiccode: PublicCodeData | undefined,
  now: Date,
  measuredAt: string
) {
  return measure(
    {
      id: "contributors",
      kind: "ecosystem",
      source: "GitHub commits",
      subject: context.projectPath,
      url: `https://github.com/${context.projectPath}/graphs/contributors`,
      caveat: "",
    },
    measuredAt,
    async () => {
      const since = new Date(now.getTime() - COMMIT_WINDOW_DAYS * 86_400_000).toISOString();
      const { items, complete } = await githubPages(
        fetchFn,
        `/repos/${context.projectPath}/commits?since=${since}`,
        MAX_COMMIT_PAGES
      );
      const commits = items.map((item): CommitAuthor => {
        const author = isRecord(item.author) ? item.author : {};
        const gitAuthor = isRecord(item.commit) && isRecord(item.commit.author) ? item.commit.author : {};
        const names = [author.login, gitAuthor.name].filter((name): name is string => typeof name === "string");
        return {
          email: typeof gitAuthor.email === "string" ? gitAuthor.email : null,
          bot: author.type === "Bot" || names.some((name) => BOT_NAME.test(name.trim())),
        };
      });
      const counts = classifyContributors(commits, ownerDomainsFromPublicCode(publiccode));
      if (counts.total === 0) return null;

      const scope = complete ? "the commits of the last 12 months" : `the latest ${items.length} commits of the last 12 months`;
      const named = counts.insideDomains.length > 0 ? ` (${counts.insideDomains.join(", ")})` : "";
      return {
        figures: [
          { label: "contributors", value: counts.total },
          { label: "from the owning organisation", value: counts.inside },
          { label: "from other organisations", value: counts.other },
          { label: "unknown", value: counts.unknown },
        ],
        caveat:
          `Authors of ${scope}, told apart by email domain. The owning organisation${named} is the most common ` +
          "organisation domain plus the domains in publiccode.yml; personal, hidden and noreply addresses are unknown, " +
          "and one person with two addresses counts twice. Bots are left out.",
      };
    }
  );
}

function declaredUsersSource(usedBy: string[], measuredAt: string): UsageSource | null {
  const names = [...new Set(usedBy.map((name) => name.trim()).filter(Boolean))];
  if (names.length === 0) return null;
  return {
    id: "publiccode-usedby",
    kind: "declared",
    source: "publiccode.yml usedBy",
    subject: null,
    url: null,
    measuredAt,
    caveat: "Self-declared by the maintainers and not verified.",
    figures: [{ label: names.length === 1 ? "organisation named" : "organisations named", value: names.length }],
    names,
  };
}

function readmePath(tree: string[]): string | undefined {
  return tree.find((path) => /^readme(\.[a-z]+)?$/i.test(path));
}

/**
 * Who uses the component and how much, per source, without a rating: declared
 * users, package downloads, container pulls, dependents and repository
 * activity. Only sources that know the component are shown; a source that
 * fails is shown as not measured. Never stores names, logins, email addresses
 * or the email domain of one person.
 */
export async function checkUsage(
  context: RepoContext,
  meta: RepositoryMeta,
  tree: string[],
  publiccode: PublicCodeData | undefined,
  options: UsageOptions = {}
): Promise<CheckResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const now = options.now ?? new Date();
  const measuredAt = now.toISOString().slice(0, 10);
  const isGitHub = context.provider.id === "github";

  const treeFiles = new Set(tree);
  const readme = readmePath(tree);
  const paths = [...MANIFEST_PATHS.filter((path) => treeFiles.has(path)), ...(readme ? [readme] : [])];
  const contents = await Promise.all(
    paths.map(async (path) => [path, await context.provider.getFileContent(context, path).catch(() => null)] as const)
  );
  const files = Object.fromEntries(contents);
  const packages = detectPackages(files);
  const images = detectImages(
    readme ? [files[readme] ?? ""] : [],
    options.dockerLocations ?? [],
    context.owner,
    context.repo
  );

  const measured = await Promise.all([
    declaredUsersSource(publiccode?.usedBy ?? [], measuredAt),
    packages.nextcloudApp ? appStoreSource(fetchFn, packages.nextcloudApp, measuredAt) : null,
    isGitHub ? releaseSource(fetchFn, context, measuredAt) : null,
    packages.npm ? npmSource(fetchFn, packages.npm, context, measuredAt) : null,
    packages.packagist ? packagistSource(fetchFn, packages.packagist, context, measuredAt) : null,
    packages.pypi ? pypiSource(fetchFn, packages.pypi, context, measuredAt) : null,
    ...images.dockerHub.map((image) => dockerHubSource(fetchFn, image, measuredAt)),
    ...images.ghcr.map((image) => ghcrSource(image, measuredAt)),
    repositorySource(context, meta, measuredAt),
    isGitHub ? contributorSource(fetchFn, context, publiccode, now, measuredAt) : null,
  ]);
  const found = measured.filter((source): source is UsageSource => source !== null);

  // deps.dev only for packages the registry confirmed as published from this repository.
  const confirmed = await Promise.all([
    found.some((source) => source.id === "npm" && !source.notMeasured) && packages.npm
      ? depsDevSource(fetchFn, "npm", packages.npm, measuredAt)
      : null,
    found.some((source) => source.id === "pypi" && !source.notMeasured) && packages.pypi
      ? depsDevSource(fetchFn, "pypi", packages.pypi, measuredAt)
      : null,
  ]);
  const sources = shownUsageSources({
    sources: [...found, ...confirmed.filter((source): source is UsageSource => source !== null)],
  });

  const failed = sources.filter((source) => source.notMeasured).length;
  const message =
    sources.length === 0
      ? "No source reports usage of this component."
      : `Usage from ${sources.length} ${sources.length === 1 ? "source" : "sources"}${
          failed > 0 ? `, ${failed} not measured` : ""
        }. Shown for information; never rated or compared.`;

  return {
    id: USAGE_CHECK_ID,
    title: "Usage and ecosystem",
    description: "Who uses the component and how much, per source. Informative: not rated and not compared across components.",
    requirementLevel: "informative",
    status: "info",
    message,
    evidence: sources.map(
      (source) => `${source.source}${source.subject ? ` ${source.subject}` : ""}: ${describeUsageSource(source)} (${source.measuredAt})`
    ),
    usage: { sources },
  };
}
