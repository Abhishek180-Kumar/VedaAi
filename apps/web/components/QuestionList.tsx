"use client";

import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { Answer, Mapping, Question } from "@/types/assessment";
import ScoreBadge from "./ScoreBadge";

interface QuestionListProps {
  questions: Question[];
  mappings: Mapping[];
  answers: Answer[];
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (questionId: string) => void;
  onToggleExpand: (questionId: string) => void;
  onExpandAll: () => void;
  unmatchedAnswerIds?: string[];
}

export default function QuestionList({
  questions,
  mappings,
  answers,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onExpandAll,
  unmatchedAnswerIds = []
}: QuestionListProps) {
  const mappingByQuestion = new Map(mappings.map((m) => [m.questionId, m]));
  const answerById = new Map(answers.map((a) => [a.id, a]));
  const unmatchedAnswers = unmatchedAnswerIds
    .map((id) => answerById.get(id))
    .filter(Boolean) as Answer[];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-veda-border shrink-0">
        <h2 className="text-sm font-semibold">Extracted Questions (from question paper)</h2>
        <button onClick={onExpandAll} className="text-xs font-medium text-veda-sub hover:text-veda-ink">
          Expand All
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.map((q, idx) => {
          const mapping = mappingByQuestion.get(q.id);
          const isSelected = selectedId === q.id;
          const isExpanded = expandedIds.has(q.id) || isSelected;

          return (
            <div
              key={q.id}
              className={`rounded-xl2 border p-3 cursor-pointer transition-colors ${
                isSelected
                  ? "border-veda-orange bg-veda-orangeSoft/30"
                  : "border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => onSelect(q.id)}
            >
              <div className="flex items-start gap-3">
                <span className="grid place-items-center w-6 h-6 rounded-full bg-gray-800 text-white text-[11px] font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{q.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {mapping && (
                    <ScoreBadge
                      score={mapping.score}
                      maxMarks={mapping.maxMarks}
                      status={mapping.status}
                      correctness={mapping.correctness}
                    />
                  )}
                  <button
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(q.id);
                    }}
                    className="text-veda-sub"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 ml-9 space-y-2">
                  {mapping?.status === "unanswered" && (
                    <p className="text-xs text-veda-sub bg-white rounded-lg p-2.5 border border-veda-border">
                      No answer found for this question.
                    </p>
                  )}
                  {mapping?.feedback && (
                    <div className="bg-white rounded-lg p-2.5 border border-veda-border">
                      <p className="text-xs font-semibold mb-1">AI Feedback</p>
                      <p className="text-xs text-veda-sub leading-relaxed">{mapping.feedback}</p>
                    </div>
                  )}
                  {mapping?.status === "needs_review" && (
                    <p className="text-[11px] text-veda-amber">
                      Confidence: {Math.round((mapping.confidence ?? 0) * 100)}% — please verify manually.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && (
          <p className="text-sm text-veda-sub text-center py-8">No questions were extracted.</p>
        )}

        {unmatchedAnswers.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle size={14} className="text-veda-amber" />
              <h3 className="text-xs font-semibold text-veda-amber uppercase tracking-wide">
                Unmatched Answers
              </h3>
            </div>
            {unmatchedAnswers.map((a) => (
              <div
                key={a.id}
                className="rounded-xl2 border border-veda-amber/30 bg-veda-amberSoft/40 p-3"
              >
                <p className="text-xs font-semibold text-veda-ink mb-1">
                  {a.questionLabelHint ? `Label: ${a.questionLabelHint}` : `Answer ${a.id}`}
                </p>
                <p className="text-xs text-veda-sub leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}