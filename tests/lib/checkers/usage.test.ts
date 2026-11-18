import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkUsage,
  classifyContributors,
  detectImages,
  detectPackages,
  normaliseRepositoryUrl,
  ownerDomainsFromPublicCode,
} from "@/lib/checkers/usage";
import { readPublicCodeData } from "@/lib/checkers/publiccode";
import { domainOf, parseMailmap } from "@/lib/contributorOrganisations";
import type { RepoContext, RepositoryMeta } from "@/lib/providers/types";
import type { UsageSource } from "@/lib/types";
import { ASPECT_MODEL, resolveCategory } from "@/lib/aspects";
import { RESULT_CATEGORY_BY_ID, RESULT_ORDER_BY_ID } from "@/lib/criteria";
import { USAGE_CHECK_ID } from "@/lib/usage";

const NOW = new Date("2026-11-18T09:00:00Z");

function contextWith(files: Record<string, string>, providerId = "github"): RepoContext {
  return {
    owner: "open-zaak",
    repo: "open-zaak",
    projectPath: "open-zaak/open-zaak",
    repoUrl: "https://github.com/open-zaak/open-zaak",
    provider: {
      id: providerId,
      hostname: providerId === "github" ? "github.com" : "gitlab.com",
      getFileContent: async (_context: RepoContext, path: string) => files[path] ?? null,
    },
  } as unknown as RepoContext;
}

const META: RepositoryMeta = {
  stargazers_count: 120,
  forks_count: 40,
  subscribers_count: 15,
  owner: { login: "open-zaak", type: "Organization" },
};

type Route = { status?: number; body?: unknown } | (() => never);

/** A fetch that answers per URL prefix; anything else is a 404. */
function fakeFetch(routes: Record<string, Route>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes)
      .filter((prefix) => url.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0];
    if (!key) return new Response("not found", { status: 404 });
    const route = routes[key];
    if (typeof route === "function") route();
    const { status = 200, body = null } = route as { status?: number; body?: unknown };
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

function timeout(): never {
  throw Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
}

function byId(sources: UsageSource[] | undefined, id: string): UsageSource | undefined {
  return sources?.find((source) => source.id === id);
}

const GH = "https://api.github.com/repos/open-zaak/open-zaak";

const PUBLICCODE = readPublicCodeData({
  usedBy: ["Gemeente Utrecht", "Gemeente Utrecht", "Gemeente Delft"],
  maintenance: { type: "contract", contractors: [{ name: "Maykin", website: "https://www.maykinmedia.nl" }] },
})!;

function commit(email: string, login: string | null = null, type = "User") {
  return { author: login ? { login, type } : null, commit: { author: { email, name: login ?? "x" } } };
}

const COMMITS = [
  commit("alice@maykinmedia.nl", "alice"),
  commit("alice@maykinmedia.nl", "alice"),
  commit("bob@maykinmedia.nl", "bob"),
  commit("carol@example.org", "carol"),
  commit("dave@gmail.com", "dave"),
  commit("123+erin@users.noreply.github.com", "erin"),
  commit("49699333+dependabot[bot]@users.noreply.github.com", "dependabot[bot]", "Bot"),
];

function author(email: string | null, login: string | null = null, bot = false) {
  return { email, login, bot };
}

describe("classifyContributors", () => {
  it("takes the organisation domain with the most authors as the owner's", async () => {
    const counts = await classifyContributors([
      author("a@conduction.nl"),
      author("B@Conduction.nl"),
      author("c@gemeente.nl"),
      author("noreply@agent.example"),
      author(null),
      author("ci@conduction.nl", null, true),
    ]);

    expect(counts).toEqual({
      total: 4,
      inside: 2,
      other: 1,
      unknown: 1,
      notLookedUp: 0,
      mostlyUnknown: false,
      insideDomains: ["conduction.nl"],
    });
  });

  it("counts the publiccode.yml domains and their subdomains as inside, and names no domain of a single author", async () => {
    const counts = await classifyContributors(
      [author("a@big.org"), author("b@big.org"), author("c@mail.small.nl")],
      { ownerDomains: ["small.nl"] }
    );

    expect(counts).toMatchObject({ total: 3, inside: 3, other: 0, unknown: 0, insideDomains: ["big.org"] });
  });

  it("counts two addresses the .mailmap joins as one author", async () => {
    const mailmap = parseMailmap("Jane <jane@conduction.nl> <jane@gmail.com>\n# comment\nJoe <joe@x.nl>\n");

    const counts = await classifyContributors(
      [author("jane@conduction.nl"), author("JANE@gmail.com"), author("joe@conduction.nl")],
      { mailmap }
    );

    expect(counts).toMatchObject({ total: 2, inside: 2, unknown: 0 });
  });

  it("looks up the profile company of unknown addresses, within the limit", async () => {
    const companies: Record<string, string | null> = {
      ana: "@ConductionNL",
      ben: "Maykin Media B.V.",
      cas: "Gemeente Delft",
      dirk: "",
      eva: "Acme",
    };
    const lookupCompany = vi.fn(async (login: string) => {
      if (login === "fail") throw new Error("HTTP 500");
      return companies[login] ?? null;
    });

    const counts = await classifyContributors(
      [
        author("a@conduction.nl"),
        author("b@conduction.nl"),
        author("m@maykinmedia.nl"),
        author("ana@gmail.com", "ana"),
        author("1+ben@users.noreply.github.com", "ben"),
        author("cas@hotmail.com", "cas"),
        author("dirk@gmail.com", "dirk"),
        author("x@gmail.com", "fail"),
        author("nologin@gmail.com"),
        author("eva@gmail.com", "eva"),
      ],
      { ownerNames: ["ConductionNL", "Conduction"], lookupCompany, lookupLimit: 5 }
    );

    expect(lookupCompany).toHaveBeenCalledTimes(5);
    expect(lookupCompany).not.toHaveBeenCalledWith("eva");
    // Inside: 2 by domain + ana by company. Other: maykin by domain, ben (matches maykinmedia.nl), cas.
    expect(counts).toMatchObject({ total: 10, inside: 3, other: 3, unknown: 4, notLookedUp: 1, mostlyUnknown: false });
  });

  it("says when the organisation of most authors stays unknown", async () => {
    const counts = await classifyContributors(
      [author("a@conduction.nl"), author("b@gmail.com", "b"), author("c@gmail.com")],
      { lookupCompany: async () => null }
    );

    expect(counts).toMatchObject({ total: 3, unknown: 2, mostlyUnknown: true });
  });
});

describe("domainOf and ownerDomainsFromPublicCode", () => {
  it("reads domains from addresses and URLs", () => {
    expect(domainOf("Jane@Example.ORG")).toBe("example.org");
    expect(domainOf("https://www.conduction.nl/about")).toBe("conduction.nl");
    expect(domainOf("conduction.nl")).toBe("conduction.nl");
    expect(domainOf("")).toBeNull();
  });

  it("takes the maintenance contacts, contractors and organisation, without personal mail domains", () => {
    const publiccode = readPublicCodeData({
      organisation: { uri: "https://www.utrecht.nl" },
      maintenance: {
        contractors: [{ name: "Acme", email: "info@acme.nl", website: "https://acme.nl" }],
        contacts: [{ name: "Jane", email: "jane@gmail.com" }, { name: "Joe", email: "joe@conduction.nl" }],
      },
    })!;

    expect(ownerDomainsFromPublicCode(publiccode).sort()).toEqual(["acme.nl", "conduction.nl", "utrecht.nl"]);
    expect(ownerDomainsFromPublicCode(undefined)).toEqual([]);
  });
});

describe("normaliseRepositoryUrl", () => {
  it.each([
    ["git+https://github.com/Open-Zaak/open-zaak.git", "github.com/open-zaak/open-zaak"],
    ["https://github.com/open-zaak/open-zaak/tree/main", "github.com/open-zaak/open-zaak"],
    ["git@github.com:open-zaak/open-zaak.git", "github.com/open-zaak/open-zaak"],
    ["github.com/open-zaak/open-zaak#readme", "github.com/open-zaak/open-zaak"],
  ])("reads %s", (url, expected) => {
    expect(normaliseRepositoryUrl(url)).toBe(expected);
  });

  it("is null for a URL without owner and name", () => {
    expect(normaliseRepositoryUrl("https://example.org")).toBeNull();
  });
});

describe("detectPackages", () => {
  it("reads the names from the manifests", () => {
    expect(
      detectPackages({
        "package.json": JSON.stringify({ name: "@scope/ui" }),
        "composer.json": JSON.stringify({ name: "Vendor/Package" }),
        "pyproject.toml": '[build-system]\nname = "not-this"\n\n[project]\nversion = "1"\nname = "open-zaak"\n',
        "appinfo/info.xml": "<info>\n  <id>openregister</id>\n  <dependencies><id>other</id></dependencies>\n</info>",
      })
    ).toEqual({ npm: "@scope/ui", packagist: "vendor/package", pypi: "open-zaak", nextcloudApp: "openregister" });
  });

  it("leaves out a private npm package and broken manifests", () => {
    expect(
      detectPackages({ "package.json": JSON.stringify({ name: "app", private: true }), "composer.json": "{" })
    ).toEqual({ npm: null, packagist: null, pypi: null, nextcloudApp: null });
  });

  it("falls back to poetry, setup.cfg and setup.py for the PyPI name", () => {
    expect(detectPackages({ "pyproject.toml": '[tool.poetry]\nname = "poetic"\n' }).pypi).toBe("poetic");
    expect(detectPackages({ "setup.cfg": "[metadata]\nname = configured\n[options]\nname = no\n" }).pypi).toBe("configured");
    expect(detectPackages({ "setup.py": 'setup(\n    name="classic",\n)' }).pypi).toBe("classic");
  });
});

describe("detectImages", () => {
  it("keeps images of the repository's owner or name and drops images it only uses", () => {
    const readme = [
      "Pull https://hub.docker.com/r/openzaak/open-zaak or docker.io/openzaak/open-zaak:latest.",
      "It needs https://hub.docker.com/r/bitnami/postgresql and docker.io/library/redis.",
      "Also on ghcr.io/open-zaak/open-zaak:1.0 and ghcr.io/someone/else.",
    ].join("\n");

    expect(detectImages([readme], [], "open-zaak", "open-zaak")).toEqual({
      dockerHub: ["openzaak/open-zaak"],
      ghcr: ["open-zaak/open-zaak"],
    });
  });

  it("always keeps the images given with the check", () => {
    expect(detectImages([], ["acme/thing", "https://hub.docker.com/r/other/image"], "o", "r")).toEqual({
      dockerHub: ["acme/thing", "other/image"],
      ghcr: [],
    });
  });
});

describe("checkUsage", () => {
  const FILES = {
    "package.json": JSON.stringify({ name: "openzaak" }),
    "pyproject.toml": '[project]\nname = "open-zaak"\n',
    "README.md": "Image: https://hub.docker.com/r/openzaak/open-zaak and ghcr.io/open-zaak/open-zaak",
  };
  const TREE = Object.keys(FILES);

  it("reports every source separately, never rated, with counts only", async () => {
    const fetchFn = fakeFetch({
      "https://registry.npmjs.org/openzaak/latest": { body: { repository: { url: "git+https://github.com/open-zaak/open-zaak.git" } } },
      "https://api.npmjs.org/downloads/point/last-month/openzaak": { body: { downloads: 1234 } },
      "https://pypi.org/pypi/open-zaak/json": { body: { info: { project_urls: { Source: "https://github.com/open-zaak/open-zaak" } } } },
      "https://pypistats.org/api/packages/open-zaak/recent": { body: { data: { last_month: 99 } } },
      "https://hub.docker.com/v2/repositories/openzaak/open-zaak/": { body: { pull_count: 645727 } },
      "https://api.deps.dev/v3/systems/npm/packages/openzaak": { body: { versions: [{ versionKey: { version: "1.2.0" }, isDefault: true }] } },
      "https://api.deps.dev/v3alpha/systems/npm/packages/openzaak/versions/1.2.0:dependents": { body: { dependentCount: 7, directDependentCount: 3 } },
      [`${GH}/releases`]: { body: [{ assets: [{ download_count: 10 }, { download_count: 5 }] }, { assets: [] }] },
      [`${GH}/commits`]: { body: COMMITS },
      "https://api.github.com/users/dave": { body: { login: "dave", company: "@maykinmedia" } },
    });

    const result = await checkUsage(contextWith(FILES), META, TREE, PUBLICCODE, {
      fetchFn,
      now: NOW,
    });

    expect(result).toMatchObject({ id: "usage", status: "info", requirementLevel: "informative" });
    expect(result.starRating).toBeUndefined();
    expect(result.rating).toBeUndefined();
    const sources = result.usage?.sources;
    expect(sources?.map((source) => source.id)).toEqual([
      "publiccode-usedby",
      "github-releases",
      "npm",
      "pypi",
      "dockerhub:openzaak/open-zaak",
      "ghcr:open-zaak/open-zaak",
      "repository",
      "contributors",
      "depsdev:npm",
    ]);
    expect(sources?.every((source) => source.measuredAt === "2026-11-18" && source.caveat.length > 0)).toBe(true);
    expect(byId(sources, "publiccode-usedby")).toMatchObject({
      figures: [{ label: "organisations named", value: 2 }],
      names: ["Gemeente Utrecht", "Gemeente Delft"],
    });
    expect(byId(sources, "npm")?.figures).toEqual([{ label: "downloads in the last month", value: 1234 }]);
    expect(byId(sources, "pypi")?.figures).toEqual([{ label: "downloads in the last month", value: 99 }]);
    expect(byId(sources, "dockerhub:openzaak/open-zaak")?.figures).toEqual([{ label: "pulls in total", value: 645727 }]);
    expect(byId(sources, "ghcr:open-zaak/open-zaak")?.notMeasured).toMatch(/no pull count/);
    expect(byId(sources, "github-releases")?.figures).toEqual([
      { label: "release file downloads", value: 15 },
      { label: "releases with files", value: 1 },
    ]);
    expect(byId(sources, "repository")?.figures).toEqual([
      { label: "stars", value: 120 },
      { label: "forks", value: 40 },
      { label: "watchers", value: 15 },
    ]);
    expect(byId(sources, "contributors")?.figures).toEqual([
      { label: "contributors", value: 5 },
      { label: "from the owning organisation", value: 3 },
      { label: "from other organisations", value: 1 },
      { label: "unknown", value: 1 },
    ]);
    expect(byId(sources, "depsdev:npm")).toMatchObject({
      subject: "openzaak@1.2.0",
      figures: [
        { label: "dependent packages", value: 7 },
        { label: "of which depend on it directly", value: 3 },
      ],
    });
    expect(byId(sources, "contributors")?.caveat).toMatch(/^Authors of the commits of the last 12 months, told apart by address after the repository's \.mailmap\..*The owning organisation \(maykinmedia\.nl\) is/);
    expect(JSON.stringify(result)).not.toMatch(/alice|bob|carol|dave|erin|dependabot|example\.org|gmail|users\.noreply|@maykinmedia"/i);
    const commitsUrl = vi.mocked(fetchFn).mock.calls.map(([url]) => String(url)).find((url) => url.includes("/commits"));
    expect(commitsUrl).toContain("since=2025-11-18T09:00:00.000Z");
    expect(result.evidence).toContain("npm openzaak: 1,234 downloads in the last month (2026-11-18)");
  });

  it("says the organisation of most contributors is unknown, and how many profiles were not looked up", async () => {
    const fetchFn = fakeFetch({
      [`${GH}/commits`]: {
        body: [commit("a@maykinmedia.nl", "a"), commit("b@gmail.com", "b"), commit("c@gmail.com", "c"), commit("d@gmail.com", "d")],
      },
    });

    const result = await checkUsage(contextWith({}), META, [], undefined, { fetchFn, now: NOW, profileLookupLimit: 1 });

    const contributors = byId(result.usage?.sources, "contributors");
    expect(contributors?.summary).toBe("4 contributors; organisation unknown for most (3 of 4)");
    expect(contributors?.figures).toEqual([
      { label: "contributors", value: 4 },
      { label: "with organisation unknown", value: 3 },
    ]);
    expect(contributors?.caveat).toMatch(/2 not looked up, because a scan looks up at most 1 profiles\.$/);
    expect(result.evidence).toContain(
      "GitHub commits open-zaak/open-zaak: 4 contributors; organisation unknown for most (3 of 4) (2026-11-18)"
    );
  });

  it("applies the repository's .mailmap", async () => {
    const files = { ".mailmap": "A <a@maykinmedia.nl> <a@gmail.com>\n" };
    const fetchFn = fakeFetch({
      [`${GH}/commits`]: { body: [commit("a@maykinmedia.nl", "a"), commit("a@gmail.com", "a")] },
    });

    const result = await checkUsage(contextWith(files), META, Object.keys(files), undefined, { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "contributors")?.figures[0]).toEqual({ label: "contributors", value: 1 });
  });

  it("leaves out a package another repository publishes under the same name", async () => {
    const fetchFn = fakeFetch({
      "https://registry.npmjs.org/openzaak/latest": { body: { repository: { url: "git+https://github.com/someone/else.git" } } },
      "https://api.npmjs.org/downloads/point/last-month/openzaak": { body: { downloads: 1234 } },
    });

    const result = await checkUsage(contextWith(FILES), {}, TREE, undefined, { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "npm")).toBeUndefined();
    expect(byId(result.usage?.sources, "depsdev:npm")).toBeUndefined();
  });

  it("shows a source that does not answer as not measured, with the reason", async () => {
    const fetchFn = fakeFetch({
      "https://hub.docker.com/v2/repositories/openzaak/open-zaak/": timeout,
      [`${GH}/commits`]: { status: 502 },
    });

    const result = await checkUsage(contextWith(FILES), META, TREE, undefined, { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "dockerhub:openzaak/open-zaak")).toMatchObject({
      figures: [],
      notMeasured: "no answer in time",
    });
    expect(byId(result.usage?.sources, "contributors")?.notMeasured).toBe("HTTP 502");
    expect(result.message).toMatch(/3 not measured/);
    expect(result.evidence).toContain("Docker Hub openzaak/open-zaak: not measured: no answer in time (2026-11-18)");
  });

  it("gives every request a timeout", async () => {
    const fetchFn = fakeFetch({});

    await checkUsage(contextWith(FILES), META, TREE, undefined, { fetchFn, now: NOW });

    const calls = vi.mocked(fetchFn).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(([, init]) => init?.signal instanceof AbortSignal)).toBe(true);
  });

  it("reads the App Store's ratings for the app id, and Packagist's downloads", async () => {
    const files = {
      "appinfo/info.xml": "<info><id>openregister</id></info>",
      "composer.json": JSON.stringify({ name: "conductionnl/openregister" }),
    };
    const context = { ...contextWith(files), projectPath: "ConductionNL/openregister", owner: "ConductionNL", repo: "openregister" };
    const fetchFn = fakeFetch({
      "https://apps.nextcloud.com/api/v1/apps.json": { body: [{ id: "other" }, { id: "openregister", ratingNumOverall: 4 }] },
      "https://packagist.org/packages/conductionnl/openregister.json": {
        body: { package: { repository: "https://github.com/ConductionNL/openregister", downloads: { total: 500, monthly: 20 }, dependents: 2 } },
      },
    });

    const result = await checkUsage(context as RepoContext, {}, Object.keys(files), undefined, { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "nextcloud-appstore")?.figures).toEqual([{ label: "ratings given", value: 4 }]);
    expect(byId(result.usage?.sources, "packagist")?.figures).toEqual([
      { label: "downloads in total", value: 500 },
      { label: "downloads in the last 30 days", value: 20 },
      { label: "dependent packages", value: 2 },
    ]);
  });

  it("finds nothing for a repository no source knows, and asks nothing GitHub-specific elsewhere", async () => {
    const fetchFn = fakeFetch({});

    const result = await checkUsage(contextWith({}, "gitlab"), {}, [], undefined, { fetchFn, now: NOW });

    expect(result.usage).toEqual({ sources: [] });
    expect(result.message).toBe("No source reports usage of this component.");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

interface GraphqlRequest {
  query: string;
  variables: { after?: string | null; id?: string };
}

/** Answers GraphQL from `answer`, and every other URL from `routes`. */
function graphqlFetch(answer: (request: GraphqlRequest) => unknown, routes: Record<string, Route> = {}) {
  const rest = fakeFetch(routes);
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) !== "https://api.github.com/graphql") return rest(input, init);
    return new Response(JSON.stringify(answer(JSON.parse(String(init?.body)) as GraphqlRequest)), { status: 200 });
  }) as unknown as typeof fetch;
}

function assets(downloads: number[], hasNextPage = false, totalCount = downloads.length, endCursor: string | null = null) {
  return { totalCount, pageInfo: { hasNextPage, endCursor }, nodes: downloads.map((downloadCount) => ({ downloadCount })) };
}

function releasePage(nodes: Array<{ id: string; releaseAssets: ReturnType<typeof assets> }>, hasNextPage: boolean, endCursor: string | null = null) {
  return { data: { repository: { releases: { pageInfo: { hasNextPage, endCursor }, nodes } } } };
}

function graphqlRequests(fetchFn: typeof fetch): GraphqlRequest[] {
  return vi
    .mocked(fetchFn)
    .mock.calls.filter(([url]) => String(url).endsWith("/graphql"))
    .map(([, init]) => JSON.parse(String(init?.body)) as GraphqlRequest);
}

describe("GitHub release downloads", () => {
  const token = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    process.env.GITHUB_TOKEN = "test-token";
  });

  afterEach(() => {
    if (token === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = token;
  });

  async function releases(fetchFn: typeof fetch) {
    const result = await checkUsage(contextWith({}), {}, [], undefined, { fetchFn, now: NOW });
    return byId(result.usage?.sources, "github-releases");
  }

  it("pages through GraphQL with the cursor and sums the downloads, also past 100 files", async () => {
    const fetchFn = graphqlFetch((request) => {
      if (request.query.includes("node(id:")) return { data: { node: { releaseAssets: assets([7]) } } };
      return request.variables.after === "page-2"
        ? releasePage([{ id: "r3", releaseAssets: assets([1, 2]) }], false)
        : releasePage(
            [
              { id: "r1", releaseAssets: assets([10, 5], true, 3, "files-2") },
              { id: "r2", releaseAssets: assets([]) },
            ],
            true,
            "page-2"
          );
    });

    expect((await releases(fetchFn))?.figures).toEqual([
      { label: "release file downloads", value: 25 },
      { label: "releases with files", value: 2 },
    ]);
    const requests = graphqlRequests(fetchFn);
    expect(requests.map((request) => request.variables)).toEqual([
      { owner: "open-zaak", name: "open-zaak", after: null },
      { id: "r1", after: "files-2" },
      { owner: "open-zaak", name: "open-zaak", after: "page-2" },
    ]);
    expect(requests[0].query).not.toMatch(/description|browserDownloadUrl/);
    expect(vi.mocked(fetchFn).mock.calls.some(([url]) => String(url).includes("/releases?"))).toBe(false);
  });

  it("reads at most five pages and then says the releases are the most recent ones", async () => {
    let page = 0;
    const fetchFn = graphqlFetch(() => {
      page += 1;
      return releasePage([{ id: `r${page}`, releaseAssets: assets([1]) }], true, `page-${page + 1}`);
    });

    expect((await releases(fetchFn))?.figures).toEqual([
      { label: "release file downloads", value: 5 },
      { label: "most recent releases with files", value: 5 },
    ]);
    expect(graphqlRequests(fetchFn)).toHaveLength(5);
  });

  it("falls back to REST when GraphQL answers with an error", async () => {
    const fetchFn = graphqlFetch(() => ({ errors: [{ message: "Something went wrong" }] }), {
      [`${GH}/releases`]: { body: [{ assets: [{ download_count: 4 }] }] },
    });

    expect((await releases(fetchFn))?.figures).toEqual([
      { label: "release file downloads", value: 4 },
      { label: "releases with files", value: 1 },
    ]);
    expect(graphqlRequests(fetchFn)).toHaveLength(1);
  });

  it("is not measured when GraphQL and REST both fail", async () => {
    const fetchFn = graphqlFetch(() => ({ errors: [{ message: "Something went wrong" }] }), {
      [`${GH}/releases`]: { status: 502 },
    });

    expect(await releases(fetchFn)).toMatchObject({ figures: [], notMeasured: "HTTP 502" });
  });

  it("reads REST without a token, as GraphQL needs one", async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchFn = graphqlFetch(() => releasePage([], false), {
      [`${GH}/releases`]: { body: [{ assets: [{ download_count: 3 }] }] },
    });

    expect((await releases(fetchFn))?.figures[0]).toEqual({ label: "release file downloads", value: 3 });
    expect(graphqlRequests(fetchFn)).toHaveLength(0);
  });
});

describe("usage result card", () => {
  it("is listed in the category of its aspect", () => {
    const category = ASPECT_MODEL.find(({ aspects }) =>
      aspects.some(({ source }) => source.type === "informative" && source.checkId === USAGE_CHECK_ID)
    )?.category;

    expect(category).toBe("Governance");
    expect(RESULT_CATEGORY_BY_ID[USAGE_CHECK_ID]).toBe(resolveCategory(category as string));
    expect(RESULT_ORDER_BY_ID).toContain(USAGE_CHECK_ID);
  });
});
