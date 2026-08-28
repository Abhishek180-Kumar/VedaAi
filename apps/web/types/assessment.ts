// Core domain model for the VedaAI Assessment Extraction & Answer Mapping app.
// All bounding boxes are normalized (0..1) relative to the page they belong to,
// so the frontend can scale them to any rendered size (desktop, mobile, zoom).

export interface BBox {
  x: number; // left, 0..1
  y: number; // top, 0..1
  width: number; // 0..1
  height: number; // 0..1
}

export interface Question {
  id: string; // e.g. "q_11_a"
  label: string; // e.g. "11(a)" — original printed numbering, preserved exactly
  parentNumber: string; // "11"
  subPart: string | null; // "a" | "b" | null
  text: string;
  page: number; // 1-indexed page in the question paper
  bbox: BBox | null;
  maxMarks: number | null;
  order: number; // printed order index, for stable sorting
}

export type MappingStatus =
  | "matched"
  | "unanswered"
  | "unmatched" // reserved for the answer-side view
  | "needs_review";

export type Correctness =
  | "correct"
  | "partially_correct"
  | "incorrect"
  | "unanswered"
  | "needs_review";

export interface AnswerSegment {
  page: number; // 1-indexed page in the answer sheet
  bbox: BBox;
}

export interface Answer {
  id: string; // e.g. "a_3"
  text: string; // transcribed handwriting
  questionLabelHint: string | null; // label the student wrote, if any (e.g. "Q2", "11 a")
  segments: AnswerSegment[]; // one or more regions; >1 means answer spans pages
  confidence: number; // 0..1, transcription/region confidence
}

export interface Mapping {
  questionId: string;
  answerIds: string[];
  confidence: number; // 0..1, mapping confidence
  status: MappingStatus;
  reason: string | null;
  score: number | null;
  maxMarks: number | null;
  correctness: Correctness;
  feedback: string | null;
  missingConcepts: string[];
}

export interface AssessmentSummary {
  totalQuestions: number;
  answered: number;
  unanswered: number;
  matched: number;
  unmatched: number;
  needsReview: number;
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
}

export interface UploadedFileMeta {
  name: string;
  sizeBytes: number;
  mimeType: string;
  pageCount: number;
  base64: string; // used server-side, never persisted
}

export interface AssessmentResult {
  status: "completed" | "error";
  questions: Question[];
  answers: Answer[];
  unmatchedAnswers: string[]; // answer ids with no confident question match
  mappings: Mapping[];
  summary: AssessmentSummary;
  error?: string;
  isDemo?: boolean;
}

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "reading_question_paper"
  | "extracting_questions"
  | "reading_answer_sheet"
  | "extracting_answers"
  | "mapping_answers"
  | "evaluating"
  | "preparing_results"
  | "done"
  | "error";

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: "",
  uploading: "Uploading documents…",
  reading_question_paper: "Reading question paper…",
  extracting_questions: "Extracting questions…",
  reading_answer_sheet: "Reading answer sheet…",
  extracting_answers: "Reading handwritten answers…",
  mapping_answers: "Mapping answers to questions…",
  evaluating: "Generating evaluation…",
  preparing_results: "Preparing results…",
  done: "Done",
  error: "Something went wrong"
};
