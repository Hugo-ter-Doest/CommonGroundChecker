import { githubHeaders } from "../github";
import {
  RESPONSE_SAMPLE_SIZE,
  activityWindows,
  authorNumbering,
  earliest,
  emailDomain,
  errorReason,
  isBotName,
  notMeasured,
  type CommitCounts,
  type CommitDomains,
  type Measured,
  type ProjectActivity,
  type Releases,
  type ResponseSet,
} from "./types";

const BASE = "https://api.github.com";
/** Activity changes slowly, so responses may be reused for an hour. */
const REVALIDATE_SECONDS = 3600;
const COMMIT_PAGES = 3;
const STATS_ATTEMPTS = 3;

interface GitHubUser {
  login?: string;
  type?: string;
}

interface FetchOptions {
  /** Wait between attempts while GitHub computes the contributor statistics */
  retryDelayMs?: number;
}

async function ghGet(path: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: REVALIDATE_SECONDS },
  } as RequestInit);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 80)}`);
  }
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}

function isHuman(user: GitHubUser | null | undefined): boolean {
  return !!user && user.type !== "Bot" && !isBotName(user.login);
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function searchCount(query: string): Promise<number> {
  const { data } = await ghGet(`/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
  return Number((data as { total_count?: number }).total_count ?? 0);
}

async function contributorCommits(fullName: string, since: Date, options: FetchOptions): Promise<Measured<CommitCounts>> {
  for (let attempt = 1; attempt <= STATS_ATTEMPTS; attempt += 1) {
    const { status, data } = await ghGet(`/repos/${fullName}/stats/contributors`);
    if (status === 202) {
      if (attempt < STATS_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs ?? 2000));
      continue;
    }
    const sinceSeconds = since.getTime() / 1000;
    const contributors = Array.isArray(data) ? data : [];
    const counts = contributors.flatMap((entry: { author?: GitHubUser | null; weeks?: Array<{ w: number; c: number }> }) => {
      if (!isHuman(entry.author)) return [];
      const commits = (entry.weeks ?? []).reduce((sum, week) => (week.w >= sinceSeconds ? sum + (week.c ?? 0) : sum), 0);
      return commits > 0 ? [commits] : [];
    });
    return {
      measured: true,
      value: {
        counts,
        scope: "the commits on the default branch in the last 12 months, of the 100 contributors GitHub reports",
      },
    };
  }
  return notMeasured("GitHub was still computing the contributor statistics; run the check again in a minute");
}

async function commitDomains(fullName: string, since: Date): Promise<Measured<CommitDomains>> {
  const authorNumber = authorNumbering();
  const commits: CommitDomains["commits"] = [];
  let sampled = 0;
  let complete = false;
  for (let page = 1; page <= COMMIT_PAGES; page += 1) {
    const { data } = await ghGet(`/repos/${fullName}/commits?since=${since.toISOString()}&per_page=100&page=${page}`);
    const items = Array.isArray(data) ? data : [];
    for (const item of items as Array<{ author?: GitHubUser | null; commit?: { author?: { email?: string; name?: string } } }>) {
      sampled += 1;
      const email = item.commit?.author?.email;
      if (item.author?.type === "Bot" || isBotName(item.author?.login) || isBotName(item.commit?.author?.name)) continue;
      const domain = emailDomain(email);
      if (!domain || typeof email !== "string") continue;
      commits.push({ domain, author: authorNumber(email) });
    }
    if (items.length < 100) {
      complete = true;
      break;
    }
  }
  const scope = complete ? "the commits of the last 12 months" : `the latest ${sampled} commits of the last 12 months`;
  return { measured: true, value: { commits, scope } };
}

async function firstResponse(
  fullName: string,
  number: number,
  author: string | undefined,
  withReviews: boolean
): Promise<string | null> {
  const responder = (user: GitHubUser | null | undefined) => isHuman(user) && user?.login !== author;
  const { data: comments } = await ghGet(`/repos/${fullName}/issues/${number}/comments?per_page=30`);
  const dates = (Array.isArray(comments) ? comments : [])
    .filter((comment: { user?: GitHubUser }) => responder(comment.user))
    .map((comment: { created_at?: string }) => comment.created_at);
  if (withReviews) {
    const { data: reviews } = await ghGet(`/repos/${fullName}/pulls/${number}/reviews?per_page=30`);
    for (const review of (Array.isArray(reviews) ? reviews : []) as Array<{ user?: GitHubUser; submitted_at?: string }>) {
      if (responder(review.user)) dates.push(review.submitted_at);
    }
  }
  return earliest(dates);
}

async function responses(
  fullName: string,
  kind: "pr" | "issue",
  from: Date,
  to: Date
): Promise<Measured<ResponseSet>> {
  const query = `repo:${fullName} is:${kind} created:${day(from)}..${day(to)}`;
  const { data } = await ghGet(
    `/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=50`
  );
  const items = ((data as { items?: unknown[] }).items ?? []) as Array<{
    number: number;
    created_at: string;
    user?: GitHubUser;
  }>;
  const sampled = items.filter((item) => isHuman(item.user)).slice(0, RESPONSE_SAMPLE_SIZE);
  const samples = await Promise.all(
    sampled.map(async (item) => ({
      createdAt: item.created_at,
      firstResponseAt: await firstResponse(fullName, item.number, item.user?.login, kind === "pr"),
    }))
  );
  return { measured: true, value: { from: day(from), to: day(to), samples } };
}

/** Pages of 100 releases read with a token; a repository that builds nightly releases needs many. */
const RELEASE_PAGES_WITH_TOKEN = 20;
const RELEASE_PAGES_WITHOUT_TOKEN = 3;
/** A tag that names a final release, such as 1.31.2 or v2.0. */
const RELEASE_TAG = /^v?\d+\.\d+(\.\d+)?$/;

/** The published releases back to the start of the window, newest first. */
async function releasesFromApi(fullName: string, since: Date): Promise<Releases> {
  const finals: string[] = [];
  const prereleases: string[] = [];
  const pages = process.env.GITHUB_TOKEN ? RELEASE_PAGES_WITH_TOKEN : RELEASE_PAGES_WITHOUT_TOKEN;
  let complete = false;
  for (let page = 1; page <= pages; page += 1) {
    const { data } = await ghGet(`/repos/${fullName}/releases?per_page=100&page=${page}`);
    const list = (Array.isArray(data) ? data : []) as Array<{
      draft?: boolean;
      prerelease?: boolean;
      published_at?: string | null;
      created_at?: string;
    }>;
    let reachedStart = false;
    for (const release of list) {
      const date = release.published_at ?? release.created_at;
      if (release.draft || !date) continue;
      (release.prerelease ? prereleases : finals).push(date);
      if (Date.parse(date) < since.getTime()) reachedStart = true;
    }
    if (list.length < 100 || reachedStart) {
      complete = true;
      break;
    }
  }
  return { dates: finals.sort().reverse(), prereleases, complete, source: "GitHub releases" };
}

/** Dates of the latest release tags, in one GraphQL call; tags have no date in the REST API. */
async function releaseTags(owner: string, name: string): Promise<string[]> {
  const query = `query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      refs(refPrefix: "refs/tags/", first: 100, orderBy: { field: TAG_COMMIT_DATE, direction: DESC }) {
        nodes { name target { ... on Commit { committedDate } ... on Tag { tagger { date } } } }
      }
    }
  }`;
  const res = await fetch(`${BASE}/graphql`, {
    method: "POST",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { owner, name } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const body = (await res.json()) as {
    data?: { repository?: { refs?: { nodes?: Array<{ name: string; target?: { committedDate?: string; tagger?: { date?: string } } }> } } };
  };
  return (body.data?.repository?.refs?.nodes ?? []).flatMap((tag) => {
    const date = tag.target?.tagger?.date ?? tag.target?.committedDate;
    return RELEASE_TAG.test(tag.name) && date ? [new Date(date).toISOString()] : [];
  });
}

async function releases(fullName: string, since: Date): Promise<Measured<Releases>> {
  const published = await releasesFromApi(fullName, since);
  if (published.dates.length > 0 || published.prereleases.length > 0) return { measured: true, value: published };
  if (!process.env.GITHUB_TOKEN) {
    return notMeasured("the repository publishes no GitHub releases, and dating its tags needs a GITHUB_TOKEN");
  }
  const [owner, name] = fullName.split("/");
  const tags = await releaseTags(owner, name);
  if (tags.length === 0) return notMeasured("the repository has no GitHub releases and no version tags");
  return { measured: true, value: { dates: tags.sort().reverse(), prereleases: [], complete: true, source: "version tags" } };
}

async function measure<T>(task: () => Promise<Measured<T>>): Promise<Measured<T>> {
  try {
    return await task();
  } catch (error) {
    return notMeasured(errorReason("GitHub", error));
  }
}

/**
 * Collects the project activity of a GitHub repository from the REST API.
 * `fullName` is the canonical owner/name from the repository metadata, because
 * search does not follow a renamed repository.
 */
export async function fetchGitHubActivity(
  fullName: string,
  now: Date,
  options: FetchOptions & { hasIssues?: boolean } = {}
): Promise<ProjectActivity> {
  const windows = activityWindows(now);
  const responsesNeedToken = notMeasured(
    "needs a GITHUB_TOKEN, because the comments of every sampled item cost an API call"
  );
  const hasToken = !!process.env.GITHUB_TOKEN;
  const quarter = day(windows.quarter);

  const [contributors, domains, changeRequests, changeRequestResponses, issueResponses, releaseDates] = await Promise.all([
    measure(() => contributorCommits(fullName, windows.year, options)),
    measure(() => commitDomains(fullName, windows.year)),
    measure(async () => {
      const [opened, closed] = await Promise.all([
        searchCount(`repo:${fullName} is:pr created:>=${quarter}`),
        searchCount(`repo:${fullName} is:pr closed:>=${quarter}`),
      ]);
      return { measured: true as const, value: { opened, closed } };
    }),
    hasToken ? measure(() => responses(fullName, "pr", windows.quarter, windows.responseCutoff)) : responsesNeedToken,
    options.hasIssues === false
      ? notMeasured("the repository has its issue tracker switched off")
      : hasToken
        ? measure(() => responses(fullName, "issue", windows.quarter, windows.responseCutoff))
        : responsesNeedToken,
    measure(() => releases(fullName, windows.year)),
  ]);

  return {
    contributorCommits: contributors,
    commitDomains: domains,
    changeRequests,
    changeRequestResponses,
    issueResponses,
    releases: releaseDates,
  };
}
