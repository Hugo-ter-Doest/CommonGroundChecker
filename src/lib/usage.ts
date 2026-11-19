import type { UsageData, UsageFigure, UsageSource, UsageSourceKind } from "./types";

/** Id of the check that reports usage. It is informative and never rated or given stars. */
export const USAGE_CHECK_ID = "usage";

/** The order the kinds of sources are shown in. */
export const USAGE_KIND_ORDER: UsageSourceKind[] = ["declared", "downloads", "containers", "ecosystem"];

export const USAGE_KIND_LABELS: Record<UsageSourceKind, string> = {
  declared: "Declared users",
  downloads: "Package downloads",
  containers: "Container pulls",
  ecosystem: "Dependents and ecosystem",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readFigure(value: unknown): UsageFigure | null {
  if (!isRecord(value) || typeof value.label !== "string") return null;
  if (typeof value.value !== "number" || !Number.isFinite(value.value)) return null;
  return { label: value.label, value: value.value };
}

function readSource(value: unknown): UsageSource | null {
  if (!isRecord(value)) return null;
  const { id, kind, source, measuredAt, caveat } = value;
  if (typeof id !== "string" || typeof source !== "string" || typeof measuredAt !== "string") return null;
  if (typeof kind !== "string" || !USAGE_KIND_ORDER.includes(kind as UsageSourceKind)) return null;

  const names = Array.isArray(value.names)
    ? value.names.filter((name): name is string => typeof name === "string")
    : undefined;
  const notMeasured = stringOrNull(value.notMeasured);
  const summary = stringOrNull(value.summary);
  return {
    id,
    kind: kind as UsageSourceKind,
    source,
    subject: stringOrNull(value.subject),
    url: stringOrNull(value.url),
    measuredAt,
    caveat: typeof caveat === "string" ? caveat : "",
    figures: Array.isArray(value.figures)
      ? value.figures.map(readFigure).filter((figure): figure is UsageFigure => figure !== null)
      : [],
    ...(names ? { names } : {}),
    ...(summary ? { summary } : {}),
    ...(notMeasured ? { notMeasured } : {}),
  };
}

/** The usage data of a stored analysis, or undefined when it has none. */
export function readUsageData(raw: unknown): UsageData | undefined {
  if (!isRecord(raw) || !Array.isArray(raw.sources)) return undefined;
  return { sources: raw.sources.map(readSource).filter((source): source is UsageSource => source !== null) };
}

/** The sources to show, in the order of their kind; empty when nothing was found. */
export function shownUsageSources(data: UsageData | undefined): UsageSource[] {
  if (!data) return [];
  return [...data.sources].sort((a, b) => USAGE_KIND_ORDER.indexOf(a.kind) - USAGE_KIND_ORDER.indexOf(b.kind));
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

/** "645,727 pulls (all time)", or "not measured: <reason>" */
export function describeUsageSource(source: UsageSource): string {
  if (source.notMeasured) return `not measured: ${source.notMeasured}`;
  if (source.summary) return source.summary;
  return source.figures.map((figure) => `${formatCount(figure.value)} ${figure.label}`).join(", ");
}
