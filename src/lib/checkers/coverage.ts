import { getFileContent } from "../github";
import type { CheckResult } from "../types";

const COVERAGE_FILE_CANDIDATES = [
  "coverage/coverage-summary.json",
  "coverage-summary.json",
  "coverage/coverage.json",
  "coverage/coverage-final.json",
  "coverage/coverage.xml",
  "coverage.xml",
  "coverage/lcov.info",
  "lcov.info",
];

function parseCoverageSummaryJson(content: string): number | null {
  try {
    const data = JSON.parse(content);
    const total = data?.total;
    if (total && typeof total === "object") {
      const lines = total.lines;
      if (lines && typeof lines === "object" && typeof lines.pct === "number") {
        return Number(lines.pct);
      }
      const statements = total.statements;
      if (statements && typeof statements === "object" && typeof statements.pct === "number") {
        return Number(statements.pct);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function parseCoverageXml(content: string): number | null {
  const match = content.match(/<coverage[^>]*\bline-rate\s*=\s*"([0-9.]+)"/i);
  if (match && Number.isFinite(Number(match[1]))) {
    return Number(match[1]) * 100;
  }

  const coveredMatch = content.match(/<coverage[^>]*\blines-covered\s*=\s*"(\d+)"/i);
  const validMatch = content.match(/<coverage[^>]*\blines-valid\s*=\s*"(\d+)"/i);
  if (coveredMatch && validMatch) {
    const covered = Number(coveredMatch[1]);
    const valid = Number(validMatch[1]);
    if (valid > 0) {
      return (covered / valid) * 100;
    }
  }

  return null;
}

function parseLcovInfo(content: string): number | null {
  let linesTotal = 0;
  let linesHit = 0;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("LF:")) {
      linesTotal += Number(line.slice(3));
    }
    if (line.startsWith("LH:")) {
      linesHit += Number(line.slice(3));
    }
  }

  if (linesTotal > 0) {
    return (linesHit / linesTotal) * 100;
  }

  return null;
}

function parseCoveragePercentage(filePath: string, content: string): number | null {
  const lcPath = filePath.toLowerCase();
  if (lcPath.endsWith("coverage-summary.json") || lcPath.endsWith("coverage.json") || lcPath.endsWith("coverage-final.json")) {
    return parseCoverageSummaryJson(content);
  }
  if (lcPath.endsWith("coverage.xml") || lcPath.endsWith("coverage.xml")) {
    return parseCoverageXml(content);
  }
  if (lcPath.endsWith("lcov.info")) {
    return parseLcovInfo(content);
  }
  return null;
}

export async function checkCoverage(
  owner: string,
  repo: string,
  tree: string[]
): Promise<CheckResult> {
  const candidates = tree.filter((path) =>
    COVERAGE_FILE_CANDIDATES.includes(path.toLowerCase())
  );

  if (candidates.length === 0) {
    return {
      id: "coverage",
      title: "Code coverage",
      description:
        "Code coverage should be reported and exceeded a minimum threshold to ensure test reliability.",
      status: "warn",
      message:
        "No coverage report file was found. Add coverage output such as coverage/coverage-summary.json, coverage.xml, or lcov.info.",
      evidence: [],
      referenceUrl:
        "https://docs.github.com/en/actions/automating-builds-and-tests/about-code-coverage-reporting",
    };
  }

  for (const candidate of candidates) {
    const content = await getFileContent(owner, repo, candidate);
    if (!content) continue;

    const percentage = parseCoveragePercentage(candidate, content);
    if (percentage === null || !Number.isFinite(percentage)) {
      continue;
    }

    const rounded = Math.round(percentage * 100) / 100;
    if (rounded >= 80) {
      return {
        id: "coverage",
        title: "Code coverage",
        description:
          "Code coverage should be reported and exceeded a minimum threshold to ensure test reliability.",
        status: "pass",
        message: `Code coverage is ${rounded.toFixed(2)}%, which meets the 80% threshold.`,
        evidence: [`${candidate}: ${rounded.toFixed(2)}%`],
        referenceUrl:
          "https://docs.github.com/en/actions/automating-builds-and-tests/about-code-coverage-reporting",
      };
    }

    return {
      id: "coverage",
      title: "Code coverage",
      description:
        "Code coverage should be reported and exceeded a minimum threshold to ensure test reliability.",
      status: "fail",
      message: `Code coverage is ${rounded.toFixed(2)}%, below the required 80% threshold.`,
      evidence: [`${candidate}: ${rounded.toFixed(2)}%`],
      referenceUrl:
        "https://docs.github.com/en/actions/automating-builds-and-tests/about-code-coverage-reporting",
    };
  }

  return {
    id: "coverage",
    title: "Code coverage",
    description:
      "Code coverage should be reported and exceeded a minimum threshold to ensure test reliability.",
    status: "warn",
    message:
      "Coverage report files were found but a supported coverage percentage could not be determined.",
    evidence: candidates,
    referenceUrl:
      "https://docs.github.com/en/actions/automating-builds-and-tests/about-code-coverage-reporting",
  };
}
