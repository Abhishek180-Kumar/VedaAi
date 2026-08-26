import type { AssessmentSummary as SummaryType } from "@/types/assessment";

export default function AssessmentSummary({ summary }: { summary: SummaryType }) {
  const items: { label: string; value: string | number }[] = [
    { label: "Total Questions", value: summary.totalQuestions },
    { label: "Answered", value: summary.answered },
    { label: "Unanswered", value: summary.unanswered },
    { label: "Matched", value: summary.matched },
    { label: "Unmatched", value: summary.unmatched },
    { label: "Needs Review", value: summary.needsReview }
  ];

  return (
    <div className="bg-white rounded-xl2 border border-veda-border p-4 mx-3 my-3 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Assessment Summary</h3>
        <span className="text-sm font-bold text-veda-orange">
          {summary.totalScore}/{summary.totalMaxScore} · {summary.percentage}%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.label} className="bg-gray-50 rounded-lg px-2 py-2 text-center">
            <p className="text-sm font-bold">{it.value}</p>
            <p className="text-[10px] text-veda-sub leading-tight">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
