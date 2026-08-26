import type { Correctness, MappingStatus } from "@/types/assessment";

export function statusVisual(status: MappingStatus, correctness: Correctness) {
  if (status === "unanswered") {
    return { text: "Not answered", bg: "bg-gray-100", fg: "text-veda-sub" };
  }
  if (status === "needs_review") {
    return { text: "Needs review", bg: "bg-veda-amberSoft", fg: "text-veda-amber" };
  }
  if (correctness === "correct") {
    return { text: null, bg: "bg-veda-greenSoft", fg: "text-veda-green" };
  }
  if (correctness === "partially_correct") {
    return { text: null, bg: "bg-veda-amberSoft", fg: "text-veda-amber" };
  }
  if (correctness === "incorrect") {
    return { text: null, bg: "bg-veda-redSoft", fg: "text-veda-red" };
  }
  return { text: null, bg: "bg-gray-100", fg: "text-veda-sub" };
}

export default function ScoreBadge({
  score,
  maxMarks,
  status,
  correctness
}: {
  score: number | null;
  maxMarks: number | null;
  status: MappingStatus;
  correctness: Correctness;
}) {
  const visual = statusVisual(status, correctness);

  if (visual.text) {
    return (
      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${visual.bg} ${visual.fg}`}>
        {visual.text}
      </span>
    );
  }

  if (maxMarks == null) {
    return (
      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${visual.bg} ${visual.fg}`}>
        —
      </span>
    );
  }

  return (
    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${visual.bg} ${visual.fg}`}>
      {score ?? 0}/{maxMarks}
    </span>
  );
}
