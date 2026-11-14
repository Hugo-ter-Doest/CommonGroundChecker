import { MIN_RATING } from "@/lib/ratings";
import { BAR_MAX_RATING, meterLabel, ratingPercent, tickPercents } from "@/lib/componentRating";

interface AspectBarProps {
  title: string;
  rating: number | null;
}

/**
 * A horizontal bar filled to a rating on the 0.5 to 5.5 scale, with
 * ticks at the star boundaries. Ticks are white on the fill and gray on the track,
 * so they stay visible on both. An unrated aspect shows an empty track.
 */
export default function AspectBar({ title, rating }: AspectBarProps) {
  const fill = ratingPercent(rating);
  const ticks = tickPercents().map((left) => (
    <span
      key={left}
      aria-hidden="true"
      className={`absolute -top-0.5 -bottom-0.5 w-0.5 ${rating !== null && left < fill ? "bg-white" : "bg-gray-500"}`}
      style={{ left: `${left}%` }}
    />
  ));

  if (rating === null) {
    return (
      <div aria-hidden="true" className="relative h-3 rounded-full bg-gray-100 border border-dashed border-gray-300">
        {ticks}
      </div>
    );
  }

  return (
    <div
      role="meter"
      aria-valuemin={MIN_RATING}
      aria-valuemax={BAR_MAX_RATING}
      aria-valuenow={Math.min(rating, BAR_MAX_RATING)}
      aria-label={meterLabel(title, rating)}
      className="relative h-3 rounded-full bg-gray-200"
    >
      <div className="h-full rounded-full bg-cg-lightblue" style={{ width: `${fill}%` }} />
      {ticks}
    </div>
  );
}
