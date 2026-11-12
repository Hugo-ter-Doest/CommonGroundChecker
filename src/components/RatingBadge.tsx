import { formatStars, ratingToStars } from "@/lib/stars";

interface RatingBadgeProps {
  rating: number | null;
  /** What is rated, read out before the number, for example "Overall rating" */
  label?: string;
  size?: "large" | "small";
}

export default function RatingBadge({ rating, label = "Overall rating", size = "small" }: RatingBadgeProps) {
  const large = size === "large";

  if (rating === null) {
    return (
      <span
        role="img"
        aria-label={`${label}: not rated`}
        className={large ? "text-sm font-semibold text-gray-500" : "text-xs text-gray-500"}
      >
        Not rated
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`${label} ${rating.toFixed(1)} of 5`}
      className={`inline-flex items-baseline ${large ? "gap-2" : "gap-1.5"}`}
    >
      <span aria-hidden="true" className={`leading-none text-amber-500 ${large ? "text-4xl" : "text-sm"}`}>
        {formatStars(ratingToStars(rating))}
      </span>
      <span aria-hidden="true" className={large ? "text-2xl font-extrabold text-gray-800" : "text-xs font-semibold text-gray-700"}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
