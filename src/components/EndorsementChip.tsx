import type { Endorsement } from "@/lib/types";

interface EndorsementChipProps {
  endorsement: Endorsement;
  /** Lists the reasons under the chip when the component does not pass */
  showReasons?: boolean;
}

export default function EndorsementChip({ endorsement, showReasons = false }: EndorsementChipProps) {
  if (endorsement.passed) {
    return (
      <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-green-300 text-green-700 bg-green-50">
        Passes
      </span>
    );
  }

  const chip = (
    <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-red-300 text-red-700 bg-red-50">
      Does not pass
    </span>
  );
  if (!showReasons || endorsement.reasons.length === 0) return chip;

  return (
    <div className="flex flex-col items-center gap-1">
      {chip}
      <ul aria-label="Why it does not pass" className="list-disc pl-4 text-xs text-red-700 space-y-0.5">
        {endorsement.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
