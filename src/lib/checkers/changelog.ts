import type { CheckResult } from "../types";

const CHANGELOG_PATTERNS = [
  "changelog",
  "changelog.md",
  "changelog.txt",
  "news.md",
  "news.txt",
  "release-notes.md",
  "release-notes.txt",
];

export function checkChangelog(tree: string[]): CheckResult {
  const lowerTree = tree.map((path) => path.toLowerCase());

  const matches = lowerTree.filter((path) => {
    const filename = path.split("/").pop() ?? path;
    return (
      CHANGELOG_PATTERNS.includes(path) ||
      CHANGELOG_PATTERNS.includes(filename) ||
      path.endsWith("/changelog") ||
      path.endsWith("/changelog.md") ||
      path.endsWith("/changelog.txt") ||
      path.endsWith("/news.md") ||
      path.endsWith("/news.txt") ||
      path.endsWith("/release-notes.md") ||
      path.endsWith("/release-notes.txt")
    );
  });

  if (matches.length === 0) {
    return {
      id: "changelog",
      title: "Changelog presence",
      description:
        "A changelog file helps stakeholders understand what changed between releases.",
      status: "warn",
      message:
        "No changelog file was found. Add a CHANGELOG.md, NEWS.md, or equivalent to document release history.",
      evidence: [],
      referenceUrl: "https://keepachangelog.com/en/1.0.0/",
    };
  }

  return {
    id: "changelog",
    title: "Changelog presence",
    description:
      "A changelog file helps stakeholders understand what changed between releases.",
    status: "pass",
    message: `Changelog file found: ${matches.slice(0, 5).join(", ")}`,
    evidence: matches.slice(0, 10),
    referenceUrl: "https://keepachangelog.com/en/1.0.0/",
  };
}
