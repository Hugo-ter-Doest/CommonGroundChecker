import { ASPECT_MODEL, resolveCategory, type AspectDefinition } from "./aspects";
import { RESULT_CATEGORY_BY_ID, type CriteriaCategory } from "./criteria";
import { measurementsForAspect } from "./measurements";
import { RATING_DOCS } from "./ratingDocs";
import { MAX_RATING, MIN_RATING, criterionRating } from "./ratings";
import type { AspectRating, CheckResult, CheckStatus, MeasurementGroup } from "./types";

/** The ratings where the rounded stars change: 1.5, 2.5, 3.5 and 4.5. */
export const STAR_BOUNDARIES = [1.5, 2.5, 3.5, 4.5] as const;

/** Where a rating lies on the 0.5 to 5.5 scale, in percent of the bar; null and out-of-range values are clamped. */
export function ratingPercent(rating: number | null): number {
  if (rating === null || !Number.isFinite(rating)) return 0;
  const clamped = Math.min(MAX_RATING, Math.max(MIN_RATING, rating));
  return Math.round(((clamped - MIN_RATING) / (MAX_RATING - MIN_RATING)) * 1000) / 10;
}

/** The positions of the star boundaries on the bar, in percent. */
export function tickPercents(): number[] {
  return STAR_BOUNDARIES.map((boundary) => ratingPercent(boundary));
}

/** "Testability 1.8 of 5.5" */
export function meterLabel(title: string, rating: number): string {
  return `${title} ${rating.toFixed(1)} of ${MAX_RATING}`;
}

/** "4 of 5 found" for a document-count aspect, otherwise null. */
export function documentCountText(aspectRating: AspectRating | undefined): string | null {
  if (aspectRating?.expected === undefined) return null;
  return `${aspectRating.found ?? 0} of ${aspectRating.expected} found`;
}

/** The slug of a category's page in the rating guide. */
export function categoryDocSlug(category: CriteriaCategory): string | undefined {
  const modelCategory = ASPECT_MODEL.find((entry) => resolveCategory(entry.category) === category)?.category;
  return RATING_DOCS.find((doc) => doc.title === modelCategory || doc.title === category)?.slug;
}

export function aspectsOfCategory(category: CriteriaCategory): AspectDefinition[] {
  return ASPECT_MODEL.find((entry) => resolveCategory(entry.category) === category)?.aspects ?? [];
}

/** A criterion an aspect is made of, as shown in the aspect's table. */
export interface AspectCriterion {
  id: string;
  title: string;
  status: CheckStatus;
  /** Its rating from 0.5 to 5.5, or null when it was not measured */
  rating: number | null;
  /** True when the report has a result card for it to link to */
  hasCard: boolean;
}

/** What an aspect is made of: the measurements of its check, or the criteria it is rated from. */
export type AspectComposition =
  | { type: "measurements"; groups: MeasurementGroup[] }
  | { type: "documents"; criteria: AspectCriterion[] }
  | { type: "criteria"; criteria: AspectCriterion[] };

function aspectCriterion(result: CheckResult): AspectCriterion {
  return {
    id: result.id,
    title: result.title,
    status: result.status,
    rating: criterionRating(result),
    hasCard: RESULT_CATEGORY_BY_ID[result.id] !== undefined,
  };
}

/**
 * The inputs of an aspect in the report. An aspect a check rates itself shows
 * the check's measurements for it, or the check as a criterion when it has none.
 */
export function aspectComposition(aspect: AspectDefinition, results: CheckResult[]): AspectComposition {
  const resultsById = new Map(results.map((result) => [result.id, result]));
  const { source } = aspect;

  if (source.type === "check-aspect") {
    const result = resultsById.get(source.checkId);
    const groups = measurementsForAspect(result?.measurements, source.key);
    if (groups.length > 0) return { type: "measurements", groups };
    return { type: "criteria", criteria: result ? [aspectCriterion(result)] : [] };
  }

  const criteria = source.checkIds.flatMap((id) => {
    const result = resultsById.get(id);
    return result ? [aspectCriterion(result)] : [];
  });
  return { type: source.type === "document-count" ? "documents" : "criteria", criteria };
}
