import { describe, expect, it, vi } from "vitest";
import {
  checkUsage,
  detectImages,
  detectPackages,
  normaliseRepositoryUrl,
} from "@/lib/checkers/usage";
import type { RepoContext, RepositoryMeta } from "@/lib/providers/types";
import type { UsageSource } from "@/lib/types";

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
      [`${GH}/contributors`]: {
        body: [{ login: "member", type: "User" }, { login: "outsider", type: "User" }, { login: "dependabot[bot]", type: "Bot" }],
      },
      "https://api.github.com/orgs/open-zaak/public_members": { body: [{ login: "Member" }] },
    });

    const result = await checkUsage(contextWith(FILES), META, TREE, ["Gemeente Utrecht", "Gemeente Utrecht", "Gemeente Delft"], {
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
      "outside-contributors",
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
    expect(byId(sources, "outside-contributors")?.figures).toEqual([
      { label: "contributors", value: 2 },
      { label: "of whom outside the owner", value: 1 },
    ]);
    expect(byId(sources, "depsdev:npm")).toMatchObject({
      subject: "openzaak@1.2.0",
      figures: [
        { label: "dependent packages", value: 7 },
        { label: "of which depend on it directly", value: 3 },
      ],
    });
    expect(byId(sources, "outside-contributors")?.caveat).toMatch(/^Outside means not one of the 1 public members of open-zaak;/);
    expect(JSON.stringify(result)).not.toMatch(/outsider|"member"|dependabot/i);
    expect(result.evidence).toContain("npm openzaak: 1,234 downloads in the last month (2026-11-18)");
  });

  it("leaves out a package another repository publishes under the same name", async () => {
    const fetchFn = fakeFetch({
      "https://registry.npmjs.org/openzaak/latest": { body: { repository: { url: "git+https://github.com/someone/else.git" } } },
      "https://api.npmjs.org/downloads/point/last-month/openzaak": { body: { downloads: 1234 } },
    });

    const result = await checkUsage(contextWith(FILES), {}, TREE, [], { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "npm")).toBeUndefined();
    expect(byId(result.usage?.sources, "depsdev:npm")).toBeUndefined();
  });

  it("shows a source that does not answer as not measured, with the reason", async () => {
    const fetchFn = fakeFetch({
      "https://hub.docker.com/v2/repositories/openzaak/open-zaak/": timeout,
      [`${GH}/contributors`]: { status: 502 },
    });

    const result = await checkUsage(contextWith(FILES), META, TREE, [], { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "dockerhub:openzaak/open-zaak")).toMatchObject({
      figures: [],
      notMeasured: "no answer in time",
    });
    expect(byId(result.usage?.sources, "outside-contributors")?.notMeasured).toBe("HTTP 502");
    expect(result.message).toMatch(/3 not measured/);
    expect(result.evidence).toContain("Docker Hub openzaak/open-zaak: not measured: no answer in time (2026-11-18)");
  });

  it("gives every request a timeout", async () => {
    const fetchFn = fakeFetch({});

    await checkUsage(contextWith(FILES), META, TREE, [], { fetchFn, now: NOW });

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

    const result = await checkUsage(context as RepoContext, {}, Object.keys(files), [], { fetchFn, now: NOW });

    expect(byId(result.usage?.sources, "nextcloud-appstore")?.figures).toEqual([{ label: "ratings given", value: 4 }]);
    expect(byId(result.usage?.sources, "packagist")?.figures).toEqual([
      { label: "downloads in total", value: 500 },
      { label: "downloads in the last 30 days", value: 20 },
      { label: "dependent packages", value: 2 },
    ]);
  });

  it("finds nothing for a repository no source knows, and asks nothing GitHub-specific elsewhere", async () => {
    const fetchFn = fakeFetch({});

    const result = await checkUsage(contextWith({}, "gitlab"), {}, [], [], { fetchFn, now: NOW });

    expect(result.usage).toEqual({ sources: [] });
    expect(result.message).toBe("No source reports usage of this component.");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
