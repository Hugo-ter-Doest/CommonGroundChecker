import type { Endorsement } from "@/lib/types";

interface EndorsementChipProps {
  endorsement: Endorsement;
}

export default function EndorsementChip({ endorsement }: EndorsementChipProps) {
  return endorsement.passed ? (
    <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-green-300 text-green-700 bg-green-50">
      Passes
    </span>
  ) : (
    <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border border-red-300 text-red-700 bg-red-50">
      Does not pass
    </span>
  );
}
