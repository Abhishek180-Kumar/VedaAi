"use client";

import { Sparkles } from "lucide-react";
import type { ProcessingStage } from "@/types/assessment";
import { STAGE_LABELS } from "@/types/assessment";

const ORDER: ProcessingStage[] = [
  "uploading",
  "reading_question_paper",
  "extracting_questions",
  "reading_answer_sheet",
  "extracting_answers",
  "mapping_answers",
  "evaluating",
  "preparing_results"
];

export default function ProcessingScreen({ stage }: { stage: ProcessingStage }) {
  const currentIndex = ORDER.indexOf(stage);

  return (
    <div className="flex-1 flex items-center justify-center bg-white rounded-xl3 m-2 md:m-4">
      <div className="text-center px-6 max-w-sm">
        <div className="mx-auto mb-4 w-16 h-16 grid place-items-center">
          <Sparkles size={48} className="text-veda-orange animate-pulse" />
        </div>
        <h2 className="text-xl font-bold">Extracting…</h2>
        <p className="text-sm text-veda-sub mt-1 mb-6">This may take a while</p>

        <ul className="text-left space-y-2">
          {ORDER.map((s, i) => {
            const done = currentIndex > i;
            const active = currentIndex === i;
            return (
              <li
                key={s}
                className={`flex items-center gap-2 text-xs transition-opacity ${
                  done || active ? "opacity-100" : "opacity-35"
                }`}
              >
                <span
                  className={`w-4 h-4 shrink-0 grid place-items-center rounded-full text-[10px] ${
                    done
                      ? "bg-veda-green text-white"
                      : active
                      ? "bg-veda-orange text-white"
                      : "bg-gray-200 text-transparent"
                  }`}
                >
                  {done ? "✓" : active ? "●" : "○"}
                </span>
                <span className={active ? "font-semibold text-veda-ink" : "text-veda-sub"}>
                  {STAGE_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
