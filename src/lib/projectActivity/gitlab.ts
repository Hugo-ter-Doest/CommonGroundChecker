import { gitlabHeaders } from "../providers/gitlab";
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

const BASE = "https://gitlab.com/api/v4";
const REVALIDATE_SECONDS = 3600;
const COMMIT_PAGES = 5;

interface GitLabUser {
  id?: number;
  username?: string;
}

async function glGet(path: string): Promise<{ data: unknown; total: number | null }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: gitlabHeaders(),
    next: { revalidate: REVALIDATE_SECONDS },
  } as RequestInit);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitLab API ${res.status}: ${body.slice(0, 80)}`);
  }
  const total = res.headers.get("x-total");
  return { data: await res.json(), total: total === null || total === "" ? null : Number(total) };
}

async function count(path: string): Promise<number> {
  const { total } = await glGet(`${path}${path.includes("?") ? "&" : "?"}per_page=1`);
  if (total === null || !Number.isFinite(total)) {
    throw new Error("GitLab gives no total for more than 10,000 items");
  }
  return total;
}

/** Counts the human commits of the last 12 months per author, and their email domains. */
async function commits(
  project: string,
  since: Date
): Promise<{ counts: Measured<CommitCounts>; domains: Measured<CommitDomains> }> {
  const authorNumber = authorNumbering();
  const perAuthor = new Map<number, number>();
  const sampledDomains: CommitDomains["commits"] = [];
  let sampled = 0;
  let complete = false;
  for (let page = 1; page <= COMMIT_PAGES; page += 1) {
    const { data } = await glGet(
      `/projects/${project}/repository/commits?since=${since.toISOString()}&per_page=100&page=${page}`
    );
    const items = (Array.isArray(data) ? data : []) as Array<{ author_email?: string; author_name?: string }>;
    for (const item of items) {
      sampled += 1;
      const email = item.author_email;
      if (typeof email !== "string" || isBotName(item.author_name) || isBotName(email.split("@")[0])) continue;
      const author = authorNumber(email);
      perAuthor.set(author, (perAuthor.get(author) ?? 0) + 1);
      const domain = emailDomain(email);
      if (domain) sampledDomains.push({ domain, author });
    }
    if (items.length < 100) {
      complete = true;
      break;
    }
  }
  const scope = complete ? "the commits of the last 12 months" : `the latest ${sampled} commits of the last 12 months`;
  return {
    counts: { measured: true, value: { counts: [...perAuthor.values()], scope } },
    domains: { measured: true, value: { commits: sampledDomains, scope } },
  };
}

async function responses(
  project: string,
  kind: "merge_requests" | "issues",
  from: Date,
  to: Date
): Promise<Measured<ResponseSet>> {
  const { data } = await glGet(
    `/projects/${project}/${kind}?created_after=${from.toISOString()}&created_before=${to.toISOString()}&order_by=created_at&sort=desc&per_page=50`
  );
  const items = (Array.isArray(data) ? data : []) as Array<{ iid: number; created_at: string; author?: GitLabUser }>;
  const sampled = items.filter((item) => !isBotName(item.author?.username)).slice(0, RESPONSE_SAMPLE_SIZE);
  const samples = await Promise.all(
    sampled.map(async (item) => {
      const { data: notes } = await glGet(
        `/projects/${project}/${kind}/${item.iid}/notes?sort=asc&order_by=created_at&per_page=50`
      );
      const dates = ((Array.isArray(notes) ? notes : []) as Array<{ system?: boolean; author?: GitLabUser; created_at?: string }>)
        .filter((note) => !note.system && note.author?.id !== item.author?.id && !isBotName(note.author?.username))
        .map((note) => note.created_at);
      return { createdAt: item.created_at, firstResponseAt: earliest(dates) };
    })
  );
  return {
    measured: true,
    value: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), samples },
  };
}

async function releases(project: string): Promise<Measured<Releases>> {
  const { data } = await glGet(`/projects/${project}/releases?per_page=100`);
  const dates = ((Array.isArray(data) ? data : []) as Array<{ released_at?: string; upcoming_release?: boolean }>).flatMap(
    (release) => (release.released_at && !release.upcoming_release ? [release.released_at] : [])
  );
  if (dates.length === 0) {
    return notMeasured("the project publishes no GitLab releases, and the API gives tags no date");
  }
  return { measured: true, value: { dates: dates.sort().reverse(), prereleases: [], complete: true, source: "GitLab releases" } };
}

async function measure<T>(task: () => Promise<Measured<T>>): Promise<Measured<T>> {
  try {
    return await task();
  } catch (error) {
    return notMeasured(errorReason("GitLab", error));
  }
}

/** Collects the project activity of a GitLab project from the REST API. */
export async function fetchGitLabActivity(projectPath: string, now: Date): Promise<ProjectActivity> {
  const project = encodeURIComponent(projectPath);
  const windows = activityWindows(now);
  const quarter = windows.quarter.toISOString();

  const [commitData, changeRequests, changeRequestResponses, issueResponses, releaseDates] = await Promise.all([
    commits(project, windows.year).catch((error) => {
      const failed = notMeasured(errorReason("GitLab", error));
      return { counts: failed, domains: failed };
    }),
    measure(async () => {
      const mergeRequests = `/projects/${project}/merge_requests`;
      const [opened, merged, closed] = await Promise.all([
        count(`${mergeRequests}?created_after=${quarter}`),
        count(`${mergeRequests}?state=merged&merged_after=${quarter}`),
        // GitLab cannot filter on the closing date; a closed merge request is rarely updated after closing.
        count(`${mergeRequests}?state=closed&updated_after=${quarter}`),
      ]);
      return { measured: true as const, value: { opened, closed: merged + closed } };
    }),
    measure(() => responses(project, "merge_requests", windows.quarter, windows.responseCutoff)),
    measure(() => responses(project, "issues", windows.quarter, windows.responseCutoff)),
    measure(() => releases(project)),
  ]);

  return {
    contributorCommits: commitData.counts,
    commitDomains: commitData.domains,
    changeRequests,
    changeRequestResponses,
    issueResponses,
    releases: releaseDates,
  };
}
