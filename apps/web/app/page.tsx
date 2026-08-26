"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { TopHeader, MobileHeader } from "@/components/Headers";
import MobileDrawer from "@/components/MobileDrawer";
import UploadCard, { SelectedFile } from "@/components/UploadCard";
import ProcessingScreen from "@/components/ProcessingScreen";
import QuestionList from "@/components/QuestionList";
import AnswerSheetViewer from "@/components/AnswerSheetViewer";
import AssessmentSummary from "@/components/AssessmentSummary";
import ComingSoonScreen from "@/components/ComingSoonScreen";
import { estimatePdfPageCount, fileToBase64, validateFile } from "@/lib/fileUtils";
import type { AssessmentResult, ProcessingStage } from "@/types/assessment";

type Stage = "upload" | "processing" | "results" | "error";

const PROGRESS_SEQUENCE: ProcessingStage[] = [
  "uploading",
  "reading_question_paper",
  "extracting_questions",
  "reading_answer_sheet",
  "extracting_answers",
  "mapping_answers",
  "evaluating",
  "preparing_results"
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Exams");
  const [stage, setStage] = useState<Stage>("upload");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [questionPaper, setQuestionPaper] = useState<SelectedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<SelectedFile | null>(null);
  const [qpError, setQpError] = useState<string | null>(null);
  const [asError, setAsError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [mobileTab, setMobileTab] = useState<"questions" | "answers">("questions");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const answerSheetUrl = useMemo(
    () => (answerSheet ? URL.createObjectURL(answerSheet.file) : null),
    [answerSheet]
  );

  useEffect(() => {
    return () => {
      if (answerSheetUrl) URL.revokeObjectURL(answerSheetUrl);
    };
  }, [answerSheetUrl]);

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleSelect(kind: "qp" | "as", file: File) {
    const err = validateFile(file);
    if (kind === "qp") setQpError(err);
    else setAsError(err);
    if (err) return;

    const pageCount = await estimatePdfPageCount(file);
    const selected: SelectedFile = { file, pageCount };
    if (kind === "qp") setQuestionPaper(selected);
    else setAnswerSheet(selected);
  }

  function handleRemove(kind: "qp" | "as") {
    if (kind === "qp") {
      setQuestionPaper(null);
      setQpError(null);
    } else {
      setAnswerSheet(null);
      setAsError(null);
    }
  }

  async function handleStartMapping() {
    if (!questionPaper || !answerSheet) return;
    setStage("processing");
    setErrorMessage(null);

    let idx = 0;
    setProcessingStage(PROGRESS_SEQUENCE[0]);
    progressTimer.current = setInterval(() => {
      idx = Math.min(idx + 1, PROGRESS_SEQUENCE.length - 1);
      setProcessingStage(PROGRESS_SEQUENCE[idx]);
    }, 1400);

    try {
      const [qpBase64, asBase64] = await Promise.all([
        fileToBase64(questionPaper.file),
        fileToBase64(answerSheet.file)
      ]);

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionPaper: { mimeType: questionPaper.file.type, base64: qpBase64 },
          answerSheet: { mimeType: answerSheet.file.type, base64: asBase64 },
          grade: true
        })
      });

      const data: AssessmentResult = await res.json();

      if (progressTimer.current) clearInterval(progressTimer.current);

      if (!res.ok || data.status === "error") {
        setErrorMessage(data.error || "Processing failed. Please try again.");
        setStage("error");
        return;
      }

      setResult(data);
      if (data.questions[0]) setSelectedQuestionId(data.questions[0].id);
      setStage("results");
    } catch (err: any) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setErrorMessage(err?.message || "Network error. Please try again.");
      setStage("error");
    }
  }

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  function handleBack() {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setStage("upload");
    setResult(null);
    setQuestionPaper(null);
    setAnswerSheet(null);
    setQpError(null);
    setAsError(null);
    setSelectedQuestionId(null);
    setExpandedIds(new Set());
    setErrorMessage(null);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    if (!result) return;
    setExpandedIds(new Set(result.questions.map((q) => q.id)));
  }

  function handleSelectQuestion(id: string) {
    setSelectedQuestionId(id);
    setMobileTab("answers");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeLabel={activeNav} onNavigate={setActiveNav} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader breadcrumb={activeNav} onBack={handleBack} showBack={stage !== "upload"} />
        <MobileHeader
          onMenuClick={() => setMobileDrawerOpen(true)}
          onBack={handleBack}
          showBack={stage !== "upload"}
        />

        <MobileDrawer
          open={mobileDrawerOpen}
          activeLabel={activeNav}
          onNavigate={setActiveNav}
          onClose={() => setMobileDrawerOpen(false)}
        />

        {activeNav !== "Exams" && <ComingSoonScreen pageName={activeNav} />}

        {activeNav === "Exams" && stage === "upload" && (
          <UploadScreen
            questionPaper={questionPaper}
            answerSheet={answerSheet}
            qpError={qpError}
            asError={asError}
            onSelect={handleSelect}
            onRemove={handleRemove}
            onStart={handleStartMapping}
          />
        )}

        {activeNav === "Exams" && stage === "processing" && (
          <div className="flex-1 flex flex-col p-2 md:p-4">
            <ProcessingScreen stage={processingStage} />
          </div>
        )}

        {activeNav === "Exams" && stage === "error" && (
          <div className="flex-1 grid place-items-center p-6">
            <div className="text-center max-w-sm">
              <p className="text-sm font-semibold text-veda-red mb-1">Something went wrong</p>
              <p className="text-sm text-veda-sub mb-4">{errorMessage}</p>
              <button
                onClick={() => setStage("upload")}
                className="px-4 py-2 rounded-full bg-veda-ink text-white text-sm font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {activeNav === "Exams" && stage === "results" && result && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile toggle */}
            <div className="md:hidden px-4 py-3">
              <div className="grid grid-cols-2 bg-white rounded-full p-1 border border-veda-border">
                <button
                  onClick={() => setMobileTab("questions")}
                  className={`py-2 rounded-full text-sm font-semibold ${
                    mobileTab === "questions" ? "bg-veda-ink text-white" : "text-veda-sub"
                  }`}
                >
                  Questions
                </button>
                <button
                  onClick={() => setMobileTab("answers")}
                  className={`py-2 rounded-full text-sm font-semibold ${
                    mobileTab === "answers" ? "bg-veda-ink text-white" : "text-veda-sub"
                  }`}
                >
                  Answer Sheet
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0 gap-3 px-0 md:px-3 pb-3">
              <div
                className={`flex-col min-h-0 w-full md:w-[42%] bg-white md:rounded-xl2 md:border md:border-veda-border ${
                  mobileTab === "questions" ? "flex" : "hidden md:flex"
                }`}
              >
                <AssessmentSummary summary={result.summary} />
                <QuestionList
                  questions={result.questions}
                  mappings={result.mappings}
                  answers={result.answers}
                  selectedId={selectedQuestionId}
                  expandedIds={expandedIds}
                  onSelect={handleSelectQuestion}
                  onToggleExpand={toggleExpand}
                  onExpandAll={expandAll}
                  unmatchedAnswerIds={result.unmatchedAnswers}
                />
              </div>

              <div
                className={`flex-col min-h-0 flex-1 bg-white md:rounded-xl2 md:border md:border-veda-border overflow-hidden ${
                  mobileTab === "answers" ? "flex" : "hidden md:flex"
                }`}
              >
                <AnswerSheetViewer
                  fileUrl={answerSheetUrl}
                  mimeType={answerSheet?.file.type || "application/pdf"}
                  answers={result.answers}
                  mappings={result.mappings}
                  questions={result.questions}
                  selectedQuestionId={selectedQuestionId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadScreen({
  questionPaper,
  answerSheet,
  qpError,
  asError,
  onSelect,
  onRemove,
  onStart
}: {
  questionPaper: SelectedFile | null;
  answerSheet: SelectedFile | null;
  qpError: string | null;
  asError: string | null;
  onSelect: (kind: "qp" | "as", file: File) => void;
  onRemove: (kind: "qp" | "as") => void;
  onStart: () => void;
}) {
  const canStart = !!questionPaper && !!answerSheet && !qpError && !asError;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight">
        Upload{" "}
        <span className="bg-veda-orangeSoft text-veda-orange px-2 py-0.5 rounded-md">
          Question Paper &amp; Answer Sheets
        </span>
      </h1>
      <p className="text-sm text-veda-sub mt-2 mb-6">Upload both files to get started</p>

      <div className="w-20 h-20 rounded-full bg-veda-orangeSoft grid place-items-center mb-8 text-3xl">
        📝
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadCard
          label="Upload question paper"
          accentLabel="Question Paper"
          selected={questionPaper}
          onSelect={(f) => onSelect("qp", f)}
          onRemove={() => onRemove("qp")}
          error={qpError}
        />
        <UploadCard
          label="Upload answer sheet"
          accentLabel="Answer Sheet"
          selected={answerSheet}
          onSelect={(f) => onSelect("as", f)}
          onRemove={() => onRemove("as")}
          error={asError}
        />
      </div>

      <button
        disabled={!canStart}
        onClick={onStart}
        className={`mt-8 px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
          canStart
            ? "bg-veda-ink text-white hover:bg-black"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        Start Mapping →
      </button>
      <p className="text-xs text-veda-sub mt-3 text-center max-w-xs">
        Once both files are uploaded, you&apos;ll be able to map answers with questions
      </p>
    </div>
  );
}
