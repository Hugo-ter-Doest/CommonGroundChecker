"use client";

import type { CheckResult } from "@/lib/types";
import { criterionAnchorId } from "@/lib/criteria";
import { splitIssues, type IssueEntry } from "@/lib/issues";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { MouseEvent } from "react";

export { splitIssues, type IssueEntry, type IssueSplit } from "@/lib/issues";

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
    empty: "No missing mandatory items",
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
    empty: "No missing or incomplete items",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    statusLabel: "Warning",
  },
} as const;

function IssueBlock({ kind, entries }: IssueBlockProps) {
  const config = BLOCK_CONFIG[kind];
  const Icon = config.icon;
  const countLabel = `${entries.length} ${entries.length === 1 ? config.singular : config.plural}`;

  return (
    <section
      aria-labelledby={config.headingId}
      className={`rounded-xl border ${config.border} ${config.bg} p-5`}
    >
      <h3 id={config.headingId} className={`flex items-center gap-2 font-semibold ${config.text}`}>
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>
          {countLabel}: {config.title.toLowerCase()}
        </span>
      </h3>

      {entries.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {config.empty}
        </p>
      ) : (
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
                  className="font-semibold text-gray-900 underline hover:text-cg-lightblue"
                >
                  {result.title}
                  <span className="sr-only">: go to the {result.title} result</span>
                </a>
                <span className="text-xs text-gray-600">{category}</span>
              </div>
              <p className="mt-1 text-gray-700">{result.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface IssueBlocksProps {
  results: CheckResult[];
}

export default function IssueBlocks({ results }: IssueBlocksProps) {
  const { errors, warnings } = splitIssues(results);

  return (
    <div className="grid gap-4">
      <IssueBlock kind="errors" entries={errors} />
      <IssueBlock kind="warnings" entries={warnings} />
    </div>
  );
}
