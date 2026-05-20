import { GitHubRepositoryProvider } from "../providers/github";
import type { RepoContext } from "../providers/types";

export function buildLegacyRepoContext(owner: string, repo: string): RepoContext {
  return {
    owner,
    repo,
    projectPath: `${owner}/${repo}`,
    repoUrl: `https://github.com/${owner}/${repo}`,
    provider: GitHubRepositoryProvider,
  };
}
