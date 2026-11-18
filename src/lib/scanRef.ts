import type { RepoContext, RepositoryRelease } from "./providers/types";

/** The requested ref that scans the newest stable release instead of a branch. */
export const LATEST_RELEASE_REF = "latest-release";

/**
 * How the scanned ref was chosen: the repository's default branch, a branch
 * or tag named in the request, the newest stable release, or the newest
 * stable semver tag when the repository has no release.
 */
export type ScanRefKind = "default-branch" | "branch" | "release" | "tag";

export interface ResolvedScanRef {
  /** Branch or tag name that is scanned. */
  ref: string;
  kind: ScanRefKind;
  /** Commit SHA the ref pointed at, or null when the provider did not return one. */
  commit: string | null;
  /** Set when the requested ref could not be used as asked. */
  warning?: string;
}

/** A requested branch or tag that is invalid or does not exist; the scan does not start. */
export class ScanRefError extends Error {}

/**
 * Reads a requested ref. An empty or missing value means the default branch
 * and is returned as null; otherwise the value is `latest-release` or a
 * branch or tag name that follows git's ref-name rules. Returns `undefined`
 * for any other value.
 */
export function normalizeRequestedRef(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === LATEST_RELEASE_REF) return trimmed;
  const valid =
    trimmed.length <= 255 &&
    !/[\s~^:?*[\\\x00-\x1f\x7f]/.test(trimmed) &&
    !trimmed.includes("..") &&
    !trimmed.includes("@{") &&
    !trimmed.includes("//") &&
    !/^[-/.]|[/.]$|\.lock$|\/\./.test(trimmed);
  return valid ? trimmed : undefined;
}

const STABLE_SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:\+[\w.-]+)?$/i;

/** Whether a tag is a stable semantic version: `1.2.3` or `v1.2.3`, no pre-release suffix. */
export function isStableSemverTag(tag: string): boolean {
  return STABLE_SEMVER.test(tag.trim());
}

/** The highest stable semver tag, or null when there is none. */
export function pickNewestStableSemverTag(tags: string[]): string | null {
  const parsed = tags
    .map((tag) => tag.trim())
    .map((tag) => ({ tag, match: tag.match(STABLE_SEMVER) }))
    .filter((entry): entry is { tag: string; match: RegExpMatchArray } => entry.match !== null)
    .map(({ tag, match }) => ({
      tag,
      parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    }));
  parsed.sort((a, b) => {
    for (let i = 0; i < 3; i += 1) {
      if (a.parts[i] !== b.parts[i]) return b.parts[i] - a.parts[i];
    }
    return 0;
  });
  return parsed[0]?.tag ?? null;
}

/**
 * The tag of the newest published stable release. Drafts, releases marked
 * as pre-release and tags with a pre-release suffix (`-rc.1`) are skipped.
 */
export function pickLatestStableRelease(
  releases: Array<{ tag: string; draft: boolean; prerelease: boolean; publishedAt: string | null }>
): string | null {
  const stable = releases
    .filter((release) => release.tag && !release.draft && !release.prerelease)
    .filter((release) => !/^v?\d+\.\d+\.\d+-/.test(release.tag));
  stable.sort(
    (a, b) => Date.parse(b.publishedAt ?? "1970-01-01") - Date.parse(a.publishedAt ?? "1970-01-01")
  );
  return stable[0]?.tag ?? null;
}

async function commitOrNull(context: RepoContext, ref: string): Promise<string | null> {
  try {
    return await context.provider.getCommitSha(context, ref);
  } catch {
    return null;
  }
}

/**
 * Works out which ref a check scans and the commit it points at.
 *
 * - no ref: the default branch;
 * - `latest-release`: the newest stable release, else the newest stable
 *   semver tag, else the default branch with a warning;
 * - a branch or tag name: that ref, or a ScanRefError when it does not exist.
 */
export async function resolveScanRef(
  context: RepoContext,
  defaultBranch: string,
  requested: string | null
): Promise<ResolvedScanRef> {
  const { provider } = context;

  if (!requested) {
    return {
      ref: defaultBranch,
      kind: "default-branch",
      commit: await commitOrNull(context, defaultBranch),
    };
  }

  if (requested === LATEST_RELEASE_REF) {
    const releases = await provider.listReleases(context).catch((): RepositoryRelease[] => []);
    const release = pickLatestStableRelease(releases);
    if (release) {
      return { ref: release, kind: "release", commit: await commitOrNull(context, release) };
    }

    const tags = await provider.listTags(context).catch((): string[] => []);
    const tag = pickNewestStableSemverTag(tags);
    if (tag) {
      return { ref: tag, kind: "tag", commit: await commitOrNull(context, tag) };
    }

    return {
      ref: defaultBranch,
      kind: "default-branch",
      commit: await commitOrNull(context, defaultBranch),
      warning: `No stable release or semver tag was found, so the default branch ${defaultBranch} was scanned instead of the latest release.`,
    };
  }

  const commit = await provider.getCommitSha(context, requested);
  if (!commit) {
    throw new ScanRefError(
      `Branch or tag "${requested}" was not found in ${context.projectPath}.`
    );
  }
  const tags = await provider.listTags(context).catch((): string[] => []);
  return { ref: requested, kind: tags.includes(requested) ? "tag" : "branch", commit };
}

/** How a scanned ref reads on a page, for example `development` or `release v1.2.0`. */
export function formatScannedRef(ref: string, kind: ScanRefKind | null | undefined): string {
  if (kind === "release") return `release ${ref}`;
  if (kind === "tag") return `tag ${ref}`;
  if (kind === "default-branch") return `${ref} (default branch)`;
  return ref;
}

/** "development @ abc1234", or just the ref when the commit is unknown. */
export function formatScanned(
  ref: string,
  kind: ScanRefKind | null | undefined,
  commit: string | null | undefined
): string {
  const label = formatScannedRef(ref, kind);
  return commit ? `${label} @ ${commit.slice(0, 7)}` : label;
}
