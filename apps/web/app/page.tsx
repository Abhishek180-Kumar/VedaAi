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
                <AssessmentSummary summary={result.summary} isDemo={result.isDemo} />
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

      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full bg-veda-orangeSoft" />
        <svg
          viewBox="0 0 96 96"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="avatarClip">
              <circle cx="48" cy="48" r="34" />
            </clipPath>
          </defs>
          <circle cx="48" cy="48" r="34" fill="#FDF1E7" />
          <g clipPath="url(#avatarClip)">
            <path d="M16 96 C14 60 20 30 30 22 C24 40 26 60 24 96 Z" fill="#2E2016" />
            <path d="M80 96 C82 60 76 30 66 22 C72 40 70 60 72 96 Z" fill="#2E2016" />
            <path d="M12 96 C12 76 27 65 48 65 C69 65 84 76 84 96 Z" fill="#D9631E" />
            <path d="M35 68 L48 84 L61 68 L61 96 L35 96 Z" fill="#FFFFFF" />
            <rect x="41" y="56" width="14" height="18" fill="#E7A876" />
            <path
              d="M18 54 C15 26 30 12 48 12 C66 12 81 26 78 54 C78 44 74 38 70 38 C70 26 60 18 48 18 C36 18 26 26 26 38 C22 38 18 44 18 54 Z"
              fill="#33241A"
            />
            <circle cx="48" cy="43" r="18" fill="#F3C29B" />
            <path
              d="M30 33 C30 20 38 13 48 13 C58 13 66 20 66 33 C66 27 60 30 56 26 C52 31 44 31 40 26 C36 30 30 27 30 33 Z"
              fill="#33241A"
            />
            <path d="M28 34 C25 44 25 56 28 66 C31 58 31 44 31 34 Z" fill="#33241A" />
            <path d="M68 34 C71 44 71 56 68 66 C65 58 65 44 65 34 Z" fill="#33241A" />
            <path d="M39 37 Q48 33.5 57 37" stroke="#33241A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <circle cx="41" cy="45" r="6.5" fill="#FFFFFF" fillOpacity="0.3" stroke="#2B2B2B" strokeWidth="2" />
            <circle cx="55" cy="45" r="6.5" fill="#FFFFFF" fillOpacity="0.3" stroke="#2B2B2B" strokeWidth="2" />
            <line x1="47.5" y1="45" x2="48.5" y2="45" stroke="#2B2B2B" strokeWidth="2" />
            <line x1="34.5" y1="43" x2="30" y2="41" stroke="#2B2B2B" strokeWidth="1.5" />
            <line x1="61.5" y1="43" x2="66" y2="41" stroke="#2B2B2B" strokeWidth="1.5" />
            <circle cx="41" cy="45" r="1.8" fill="#2B2B2B" />
            <circle cx="55" cy="45" r="1.8" fill="#2B2B2B" />
            <path d="M48 47 L46.5 52 Q48 53.2 49.5 52" stroke="#D89B6E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M42 56 Q48 59.5 54 56" stroke="#8A4B2E" strokeWidth="1.7" fill="none" strokeLinecap="round" />
            <circle cx="35" cy="51" r="2.5" fill="#E88A5C" fillOpacity="0.35" />
            <circle cx="61" cy="51" r="2.5" fill="#E88A5C" fillOpacity="0.35" />
            <g transform="translate(28,64)">
              <path d="M2 5 L20 1 L20 22 L2 26 Z" fill="#FFFFFF" stroke="#D9631E" strokeWidth="1.1" />
              <path d="M20 1 L38 5 L38 26 L20 22 Z" fill="#FAFAFA" stroke="#D9631E" strokeWidth="1.1" />
              <line x1="6" y1="11" x2="15" y2="8.5" stroke="#D9631E" strokeWidth="0.9" />
              <line x1="6" y1="15" x2="15" y2="12.5" stroke="#D9631E" strokeWidth="0.9" />
              <line x1="6" y1="19" x2="15" y2="16.5" stroke="#D9631E" strokeWidth="0.9" />
              <line x1="25" y1="8.5" x2="34" y2="11" stroke="#D9631E" strokeWidth="0.9" />
              <line x1="25" y1="12.5" x2="34" y2="15" stroke="#D9631E" strokeWidth="0.9" />
              <line x1="25" y1="16.5" x2="34" y2="19" stroke="#D9631E" strokeWidth="0.9" />
            </g>
          </g>
        </svg>
        <span className="absolute -top-1 left-4 w-2.5 h-2.5 rounded-full bg-veda-orange" />
        <span className="absolute top-4 -right-1 w-2 h-2 rounded-full bg-veda-orange" />
        <span className="absolute -bottom-1 left-6 w-2 h-2 rounded-full bg-veda-orange" />
        <span className="absolute bottom-3 -left-1 w-2.5 h-2.5 rounded-full bg-veda-orange" />
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
