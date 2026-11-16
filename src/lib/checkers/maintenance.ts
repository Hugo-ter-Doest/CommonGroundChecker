import yaml from "js-yaml";
import type { CheckResult } from "../types";
import type { RepoContext } from "../providers/types";
import { findPubliccodeFile } from "./publiccode";

const BASE_RESULT = {
  id: "maintenance",
  title: "Maintained",
  description:
    "The component is maintained: publiccode.yml declares who maintains it, and a maintenance contract has not ended.",
  referenceUrl: "https://publiccodeyml.github.io/v0/schema.core.html#section-maintenance",
} as const;

function result(status: CheckResult["status"], message: string, evidence: string[] = []): CheckResult {
  return { ...BASE_RESULT, status, message, evidence };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function names(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => record(entry)?.name)
    .filter((name): name is string => typeof name === "string" && name.trim() !== "");
}

/** A YAML date, which js-yaml may already have turned into a Date, as YYYY-MM-DD; null when it is not a date. */
function isoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  return null;
}

/** Judges the `maintenance` section of a parsed publiccode.yml on `today` (YYYY-MM-DD). */
export function judgeMaintenance(publiccode: unknown, file: string, today: string): CheckResult {
  const maintenance = record(record(publiccode)?.maintenance);
  const type = maintenance?.type;
  if (typeof type !== "string") {
    return result("warn", `${file} does not declare maintenance.type, so it is unknown whether anyone maintains the component.`, [file]);
  }

  if (type === "none") {
    return result("fail", `${file} declares maintenance.type none: nobody maintains the component.`, [file]);
  }

  if (type === "contract") {
    const contractors = (Array.isArray(maintenance?.contractors) ? maintenance.contractors : [])
      .map((entry) => ({ name: record(entry)?.name, until: isoDate(record(entry)?.until) }))
      .filter((entry): entry is { name: string; until: string | null } => typeof entry.name === "string");
    if (contractors.length === 0) {
      return result("warn", `${file} declares maintenance under contract, but names no contractor.`, [file]);
    }
    const current = contractors.filter((entry) => entry.until !== null && entry.until >= today);
    const evidence = contractors.map((entry) => `${entry.name}, until ${entry.until ?? "no valid date"}`);
    if (current.length === 0) {
      if (contractors.some((entry) => entry.until === null)) {
        return result(
          "warn",
          `${file} names a contractor without a valid end date (until), so it is unknown whether the contract still runs.`,
          evidence
        );
      }
      const ends = contractors.map((entry) => entry.until as string).sort();
      return result("fail", `The maintenance contract ended on ${ends[ends.length - 1]}.`, evidence);
    }
    return result("pass", `Maintained under contract by ${current.map((entry) => `${entry.name} until ${entry.until}`).join(", ")}.`, evidence);
  }

  if (type === "internal" || type === "community") {
    const contacts = names(maintenance?.contacts);
    if (contacts.length === 0) {
      return result("warn", `${file} declares ${type} maintenance, but names no contact.`, [file]);
    }
    return result("pass", `Maintained (${type}) by ${contacts.join(", ")}`.replace(/\.?$/, "."), contacts);
  }

  return result("warn", `${file} declares an unknown maintenance.type "${type}". Use internal, contract, community or none.`, [file]);
}

export async function checkMaintenance(context: RepoContext, tree: string[], today = new Date()): Promise<CheckResult> {
  const file = findPubliccodeFile(tree);
  if (!file) {
    return result("warn", "No publiccode.yml was found, so it is unknown whether anyone maintains the component.");
  }

  const content = await context.provider.getFileContent(context, file);
  if (!content) {
    return result("warn", `Found ${file} but could not read its contents.`, [file]);
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch {
    return result("warn", `Found ${file} but it is not valid YAML.`, [file]);
  }
  return judgeMaintenance(parsed, file, today.toISOString().slice(0, 10));
}
