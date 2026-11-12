import { MAX_RATING, MIN_RATING } from "@/lib/ratings";
import { meterLabel, ratingPercent, tickPercents } from "@/lib/componentRating";

interface AspectBarProps {
  title: string;
  rating: number | null;
}

/**
 * A horizontal bar filled to a rating on the 0.5 to 5.5 scale, with ticks at
 * the star boundaries. An unrated aspect shows an empty track.
 */
export default function AspectBar({ title, rating }: AspectBarProps) {
  const ticks = tickPercents().map((left) => (
    <span
      key={left}
      aria-hidden="true"
      className="absolute -top-0.5 -bottom-0.5 w-px bg-gray-500"
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
      aria-valuemax={MAX_RATING}
      aria-valuenow={rating}
      aria-label={meterLabel(title, rating)}
      className="relative h-3 rounded-full bg-gray-200"
    >
      <div className="h-full rounded-full bg-cg-lightblue" style={{ width: `${ratingPercent(rating)}%` }} />
      {ticks}
    </div>
  );
}
