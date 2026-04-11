import { getFileContent } from "../github";
import type { CheckResult } from "../types";

const OWNER_LINE_PATTERNS: RegExp[] = [
  /copyright\s*(?:\(c\)|©)?\s*(?:\d{4}(?:\s*[-–]\s*\d{4})?\s*)?(?:by\s+)?([^\n\r.;]+)/gi,
  /all rights reserved\s*[—–-]?\s*([^\n\r.;]+)/gi,
];

const CANDIDATE_FILES = [
  "COPYRIGHT",
  "COPYRIGHT.md",
  "COPYRIGHT.txt",
  "NOTICE",
  "NOTICE.md",
  "NOTICE.txt",
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "README.md",
  "README.rst",
  "README.txt",
  "package.json",
  "pyproject.toml",
];

function normalizeOwnerName(value: string): string {
  return value
    .replace(/^[:\s]+|[:\s]+$/g, "")
    .replace(/^by\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikePersonOrOrg(name: string): boolean {
  if (name.length < 2 || name.length > 120) return false;
  if (/^(all|copyright|rights|reserved|license)$/i.test(name)) return false;
  return /[a-z]/i.test(name);
}

function extractOwnersFromText(content: string): string[] {
  const owners = new Set<string>();

  for (const pattern of OWNER_LINE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const raw = match[1] ?? "";
      const candidates = raw
        .split(/,|\band\b|\&/i)
        .map((segment) => normalizeOwnerName(segment))
        .filter((candidate) => looksLikePersonOrOrg(candidate));

      for (const candidate of candidates) {
        owners.add(candidate);
      }
    }
  }

  return Array.from(owners);
}

function extractOwnersFromPackageJson(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as {
      author?: unknown;
      contributors?: unknown;
      maintainers?: unknown;
    };

    const values: string[] = [];
    const pushName = (value: unknown) => {
      if (typeof value === "string") {
        values.push(value);
        return;
      }
      if (value && typeof value === "object") {
        const maybeName = (value as { name?: unknown }).name;
        if (typeof maybeName === "string") {
          values.push(maybeName);
        }
      }
    };

    pushName(parsed.author);

    if (Array.isArray(parsed.contributors)) {
      for (const contributor of parsed.contributors) {
        pushName(contributor);
      }
    }

    if (Array.isArray(parsed.maintainers)) {
      for (const maintainer of parsed.maintainers) {
        pushName(maintainer);
      }
    }

    return values
      .map((value) => value.replace(/<[^>]+>|\([^)]*\)/g, ""))
      .map((value) => normalizeOwnerName(value))
      .filter((value) => looksLikePersonOrOrg(value));
  } catch {
    return [];
  }
}

function extractOwnersFromPyproject(content: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /name\s*=\s*"([^"]+)"/g,
    /name\s*=\s*'([^']+)'/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const candidate = normalizeOwnerName(match[1] ?? "");
      if (looksLikePersonOrOrg(candidate)) {
        names.add(candidate);
      }
    }
  }

  return Array.from(names);
}

export async function checkCopyrightOwner(
  owner: string,
  repo: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoMeta: any,
  tree: string[]
): Promise<CheckResult> {
  const treeByLower = new Map(tree.map((path) => [path.toLowerCase(), path]));

  const matchedFiles = CANDIDATE_FILES
    .map((candidate) => treeByLower.get(candidate.toLowerCase()))
    .filter((path): path is string => Boolean(path));

  const ownerToEvidence = new Map<string, Set<string>>();
  let foundOwnerFromLegalText = false;
  let foundOwnerFromManifest = false;

  for (const file of matchedFiles) {
    const content = await getFileContent(owner, repo, file);
    if (!content) continue;

    const ownersFromText = extractOwnersFromText(content);
    const ownersFromManifest = file.toLowerCase() === "package.json"
      ? extractOwnersFromPackageJson(content)
      : file.toLowerCase() === "pyproject.toml"
        ? extractOwnersFromPyproject(content)
        : [];

    if (ownersFromText.length > 0) foundOwnerFromLegalText = true;
    if (ownersFromManifest.length > 0) foundOwnerFromManifest = true;

    for (const detectedOwner of [...ownersFromText, ...ownersFromManifest]) {
      if (!ownerToEvidence.has(detectedOwner)) {
        ownerToEvidence.set(detectedOwner, new Set<string>());
      }
      ownerToEvidence.get(detectedOwner)?.add(file);
    }
  }

  const owners = Array.from(ownerToEvidence.keys());
  if (owners.length > 0) {
    const confidence = foundOwnerFromLegalText
      ? "high"
      : foundOwnerFromManifest
        ? "medium"
        : "low";
    const evidence = Array.from(
      new Set(
        owners.flatMap((detectedOwner) => {
          const files = Array.from(ownerToEvidence.get(detectedOwner) ?? []);
          return files.map((file) => `${file}: ${detectedOwner}`);
        })
      )
    );

    return {
      id: "copyrightowner",
      title: "Copyright / IP Owner Disclosure",
      description:
        "The repository should clearly identify probable copyright holder(s) or IP owner(s) in legal/metadata files.",
      status: "pass",
      confidence,
      message:
        owners.length === 1
          ? `Probable copyright owner detected: ${owners[0]} (confidence: ${confidence}).`
          : `Probable copyright owners detected: ${owners.join(", ")} (confidence: ${confidence}).`,
      evidence,
      referenceUrl: "https://opensource.guide/legal/",
    };
  }

  const fallbackOwner =
    typeof repoMeta?.owner?.name === "string" && repoMeta.owner.name.trim()
      ? repoMeta.owner.name.trim()
      : typeof repoMeta?.owner?.login === "string" && repoMeta.owner.login.trim()
        ? repoMeta.owner.login.trim()
        : null;

  if (fallbackOwner) {
    return {
      id: "copyrightowner",
      title: "Copyright / IP Owner Disclosure",
      description:
        "The repository should clearly identify probable copyright holder(s) or IP owner(s) in legal/metadata files.",
      status: "warn",
      confidence: "low",
      message:
        `No explicit copyright owner statement found in COPYRIGHT/NOTICE/LICENSE/README/manifest files. ` +
        `Fallback based on repository ownership: ${fallbackOwner} (confidence: low).`,
      evidence: [`repository owner metadata: ${fallbackOwner}`],
      referenceUrl: "https://opensource.guide/legal/",
    };
  }

  return {
    id: "copyrightowner",
    title: "Copyright / IP Owner Disclosure",
    description:
      "The repository should clearly identify probable copyright holder(s) or IP owner(s) in legal/metadata files.",
    status: "warn",
    confidence: "low",
    message:
      "Could not detect a probable copyright owner from repository metadata or common legal files (confidence: low).",
    evidence: [],
    referenceUrl: "https://opensource.guide/legal/",
  };
}