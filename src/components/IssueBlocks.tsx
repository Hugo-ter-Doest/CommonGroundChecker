"use client";

import type { CheckResult } from "@/lib/types";
import type { CriteriaCategory } from "@/lib/criteria";
import { CATEGORY_ORDER, RESULT_CATEGORY_BY_ID, RESULT_ORDER_BY_ID } from "@/lib/criteria";
import { AlertTriangle, XCircle } from "lucide-react";
import type { MouseEvent } from "react";

export interface IssueEntry {
  result: CheckResult;
  category: CriteriaCategory;
}

export interface IssueSplit {
  errors: IssueEntry[];
  warnings: IssueEntry[];
}

/** DOM id of a criterion's result card, used as the target of issue links. */
export function criterionAnchorId(id: string): string {
  return `criterion-${id}`;
}

function resultSortIndex(result: CheckResult, category: CriteriaCategory): [number, number] {
  const orderIndex = RESULT_ORDER_BY_ID.indexOf(result.id);
  return [
    CATEGORY_ORDER.indexOf(category),
    orderIndex === -1 ? Number.MAX_SAFE_INTEGER : orderIndex,
  ];
}

/**
 * Splits results into errors (mandatory criteria that fail) and warnings
 * (recommended criteria that fail or warn, and mandatory criteria that warn).
 * Results with status `info`, informative criteria and results without a
 * category (which have no card in the result list) are left out. A result
 * without a requirement level counts as recommended, as in ResultCard.
 */
export function splitIssues(results: CheckResult[]): IssueSplit {
  const errors: IssueEntry[] = [];
  const warnings: IssueEntry[] = [];

  const entries = results
    .filter((result) => RESULT_CATEGORY_BY_ID[result.id] !== undefined)
    .map((result) => ({ result, category: RESULT_CATEGORY_BY_ID[result.id] }))
    .sort((a, b) => {
      const [categoryA, orderA] = resultSortIndex(a.result, a.category);
      const [categoryB, orderB] = resultSortIndex(b.result, b.category);
      return categoryA - categoryB || orderA - orderB;
    });

  for (const entry of entries) {
    const level = entry.result.requirementLevel ?? "recommended";
    const { status } = entry.result;

    if (level === "mandatory" && status === "fail") {
      errors.push(entry);
    } else if (
      (level === "mandatory" && status === "warn") ||
      (level === "recommended" && (status === "fail" || status === "warn"))
    ) {
      warnings.push(entry);
    }
  }

  return { errors, warnings };
}

function openCriterion(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const hash = `#${criterionAnchorId(id)}`;
  if (window.location.hash === hash) {
    event.preventDefault();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

interface IssueBlockProps {
  kind: "errors" | "warnings";
  entries: IssueEntry[];
}

const BLOCK_CONFIG = {
  errors: {
    icon: XCircle,
    headingId: "issue-block-errors",
    singular: "error",
    plural: "errors",
    title: "Missing mandatory items",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    statusLabel: "Error",
  },
  warnings: {
    icon: AlertTriangle,
    headingId: "issue-block-warnings",
    singular: "warning",
    plural: "warnings",
    title: "Missing or incomplete items",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    statusLabel: "Warning",
  },
} as const;

/** One block of issues; a block without entries is left out. */
function IssueBlock({ kind, entries }: IssueBlockProps) {
  if (entries.length === 0) return null;

  const config = BLOCK_CONFIG[kind];
  const Icon = config.icon;
  const countLabel = `${entries.length} ${entries.length === 1 ? config.singular : config.plural}`;

  return (
    <section
      aria-labelledby={config.headingId}
      className={`rounded-xl border ${config.border} ${config.bg} p-4 sm:p-5`}
    >
      <h3 id={config.headingId} className={`flex items-center gap-2 font-semibold ${config.text}`}>
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>
          {countLabel}: {config.title.toLowerCase()}
        </span>
      </h3>

      <ul className="mt-3 space-y-2">
        {entries.map(({ result, category }) => (
          <li key={result.id} className="rounded-lg bg-white/70 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${config.border} ${config.text}`}
              >
                {config.statusLabel}
              </span>
              <a
                href={`#${criterionAnchorId(result.id)}`}
                onClick={(event) => openCriterion(event, result.id)}
                className="inline-flex min-h-[44px] items-center lg:min-h-0 font-semibold text-gray-900 underline hover:text-cg-lightblue"
              >
                {result.title}
                <span className="sr-only">: go to the {result.title} result</span>
              </a>
              <span className="text-xs text-gray-600">{category}</span>
            </div>
            <p className="mt-1 text-gray-700 break-words">{result.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface IssueBlocksProps {
  results: CheckResult[];
}

export default function IssueBlocks({ results }: IssueBlocksProps) {
  const { errors, warnings } = splitIssues(results);
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      <IssueBlock kind="errors" entries={errors} />
      <IssueBlock kind="warnings" entries={warnings} />
    </div>
  );
}
