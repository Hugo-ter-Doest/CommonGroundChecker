import { GitHubRepositoryProvider } from "./github";
import { GitLabRepositoryProvider } from "./gitlab";
import type {
  RepoContext,
  RepoIdentifier,
  RepoVersionResult,
  RepositoryProvider,
  ParsedRepoTreeUrl,
} from "./types";

const providers: RepositoryProvider[] = [GitHubRepositoryProvider, GitLabRepositoryProvider];

export type { RepoContext, RepoIdentifier, RepoVersionResult, RepositoryProvider, ParsedRepoTreeUrl };

export function resolveRepositoryContext(repoUrl: string): RepoContext | null {
  for (const provider of providers) {
    const identifier = provider.parseRepoUrl(repoUrl);
    if (identifier) {
      return {
        ...identifier,
        provider,
        repoUrl,
      };
    }
  }
  return null;
}

export function getSupportedProviders(): string[] {
  return providers.map((provider) => provider.hostname);
}
