"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import PdfPage from "./PdfPage";
import HighlightOverlay from "./HighlightOverlay";
import type { Answer, Mapping, Question } from "@/types/assessment";

interface AnswerSheetViewerProps {
  fileUrl: string | null;
  mimeType: string;
  answers: Answer[];
  mappings: Mapping[];
  questions: Question[];
  selectedQuestionId: string | null;
}

export default function AnswerSheetViewer({
  fileUrl,
  mimeType,
  answers,
  mappings,
  questions,
  selectedQuestionId
}: AnswerSheetViewerProps) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const answerById = useMemo(() => new Map(answers.map((a) => [a.id, a])), [answers]);
  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const selectedMapping = selectedQuestionId
    ? mappings.find((m) => m.questionId === selectedQuestionId) ?? null
    : null;

  const selectedAnswers = (selectedMapping?.answerIds ?? [])
    .map((id) => answerById.get(id))
    .filter(Boolean) as Answer[];

  // Jump to the page of the first segment of the newly-selected question.
  useEffect(() => {
    if (!selectedAnswers.length) return;
    const firstSegment = selectedAnswers[0].segments[0];
    if (firstSegment) setPage(firstSegment.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionId]);

  // Reset rendered size when page or zoom changes so the container
  // doesn't briefly keep the old page's dimensions.
  useEffect(() => {
    setRenderedSize({ width: 0, height: 0 });
  }, [page, zoom, fileUrl]);

  // Reset page count when the file changes.
  useEffect(() => {
    setPageCount(1);
    setPage(1);
  }, [fileUrl]);

  // Scroll to the selected answer segment after it becomes visible.
  useEffect(() => {
    if (!selectedAnswers.length || !highlightRef.current) return;
    const firstAnswer = selectedAnswers[0];
    const firstSeg = firstAnswer.segments[0];
    if (!firstSeg || firstSeg.page !== page) return;

    // Small delay to let the browser paint after page change / render.
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedQuestionId, page, selectedAnswers]);

  // All segments (from any answer) that land on the current page, with their
  // owning question label for the overlay tag.
  const segmentsOnPage = useMemo(() => {
    const result: { bbox: Answer["segments"][number]["bbox"]; label: string; isSelected: boolean }[] = [];
    for (const mapping of mappings) {
      for (const answerId of mapping.answerIds) {
        const answer = answerById.get(answerId);
        if (!answer) continue;
        for (const seg of answer.segments) {
          if (seg.page !== page) continue;
          const q = questionById.get(mapping.questionId);
          result.push({
            bbox: seg.bbox,
            label: q?.label ?? "?",
            isSelected: mapping.questionId === selectedQuestionId
          });
        }
      }
    }
    return result;
  }, [mappings, answerById, questionById, page, selectedQuestionId]);

  if (!fileUrl) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-veda-sub">
        No answer sheet available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-veda-border bg-white text-veda-ink shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            className="grid place-items-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-veda-ink"
          >
            <Minus size={12} />
          </button>
          <span className="w-10 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
            className="grid place-items-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-veda-ink"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-veda-sub">
          <button
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="disabled:opacity-30 text-veda-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium text-veda-ink">
            Page {page} of {pageCount}
          </span>
          <button
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="disabled:opacity-30 text-veda-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          ref={containerRef}
          className="relative mx-auto bg-white shadow-card inline-block"
          style={{
            width: renderedSize.width ? `${renderedSize.width}px` : "auto",
            height: renderedSize.height ? `${renderedSize.height}px` : "auto"
          }}
        >
          <PdfPage
            fileUrl={fileUrl}
            mimeType={mimeType}
            pageNumber={page}
            zoom={zoom}
            onPageCount={setPageCount}
            onRenderedSize={setRenderedSize}
          />
          {renderedSize.width > 0 && renderedSize.height > 0 &&
            segmentsOnPage.map((s, i) => (
              <HighlightOverlay
                key={i}
                bbox={s.bbox}
                label={s.label}
                active={s.isSelected}
                ref={s.isSelected ? highlightRef : undefined}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
