import type { CheckResult } from "./types";
import type { CriteriaCategory } from "./criteria";
import { CATEGORY_ORDER, RESULT_CATEGORY_BY_ID, RESULT_ORDER_BY_ID } from "./criteria";

export interface IssueEntry {
  result: CheckResult;
  category: CriteriaCategory;
}

export interface IssueSplit {
  errors: IssueEntry[];
  warnings: IssueEntry[];
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
