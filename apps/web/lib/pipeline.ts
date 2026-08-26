import { generateStructuredJSON, FilePart } from "./gemini";
import {
  QUESTION_EXTRACTION_PROMPT,
  ANSWER_EXTRACTION_PROMPT,
  buildMappingPrompt,
  buildGradingPrompt
} from "./prompts";
import {
  QuestionExtractionSchema,
  AnswerExtractionSchema,
  MappingSchema,
  GradingSchema
} from "./validation";
import type {
  Answer,
  AssessmentResult,
  AssessmentSummary,
  Correctness,
  Mapping,
  MappingStatus,
  Question
} from "@/types/assessment";

function clampUnit(n: number) {
  return Math.min(1, Math.max(0, n));
}

export async function extractQuestions(file: FilePart): Promise<Question[]> {
  const raw = await generateStructuredJSON<unknown>({
    prompt: QUESTION_EXTRACTION_PROMPT,
    files: [file]
  });
  const parsed = QuestionExtractionSchema.parse(raw);

  return parsed.questions.map((q, i) => ({
    id: `q_${i + 1}_${q.label.replace(/[^a-zA-Z0-9]/g, "")}`,
    label: q.label,
    parentNumber: q.parentNumber,
    subPart: q.subPart,
    text: q.text,
    page: q.page,
    bbox: q.bbox
      ? {
          x: clampUnit(q.bbox.x),
          y: clampUnit(q.bbox.y),
          width: clampUnit(q.bbox.width),
          height: clampUnit(q.bbox.height)
        }
      : null,
    maxMarks: q.maxMarks,
    order: i
  }));
}

export async function extractAnswers(file: FilePart): Promise<Answer[]> {
  const raw = await generateStructuredJSON<unknown>({
    prompt: ANSWER_EXTRACTION_PROMPT,
    files: [file]
  });
  const parsed = AnswerExtractionSchema.parse(raw);

  return parsed.answers.map((a, i) => ({
    id: `a_${i + 1}`,
    text: a.text,
    questionLabelHint: a.questionLabelHint,
    confidence: a.confidence,
    segments: a.segments.map((s) => ({
      page: s.page,
      bbox: {
        x: clampUnit(s.bbox.x),
        y: clampUnit(s.bbox.y),
        width: clampUnit(s.bbox.width),
        height: clampUnit(s.bbox.height)
      }
    }))
  }));
}

export async function mapQuestionsToAnswers(
  questions: Question[],
  answers: Answer[]
): Promise<{ mappings: Mapping[]; unmatchedAnswers: string[] }> {
  const questionsJson = JSON.stringify(
    questions.map((q) => ({ id: q.id, label: q.label, text: q.text, maxMarks: q.maxMarks }))
  );
  const answersJson = JSON.stringify(
    answers.map((a) => ({
      id: a.id,
      questionLabelHint: a.questionLabelHint,
      text: a.text.slice(0, 800)
    }))
  );

  // Guard: if there are no answers at all, skip the AI call.
  if (answers.length === 0) {
    return {
      mappings: questions.map((q) => baseUnansweredMapping(q)),
      unmatchedAnswers: []
    };
  }

  const raw = await generateStructuredJSON<unknown>({
    prompt: buildMappingPrompt(questionsJson, answersJson)
  });
  const parsed = MappingSchema.parse(raw);

  const mappingByQuestion = new Map(parsed.mappings.map((m) => [m.questionId, m]));

  const mappings: Mapping[] = questions.map((q) => {
    const m = mappingByQuestion.get(q.id);
    if (!m) return baseUnansweredMapping(q);
    const status: MappingStatus =
      m.answerIds.length === 0 ? "unanswered" : (m.status as MappingStatus);
    return {
      questionId: q.id,
      answerIds: m.answerIds,
      confidence: m.confidence,
      status,
      reason: m.reason,
      score: null,
      maxMarks: q.maxMarks,
      correctness: status === "unanswered" ? "unanswered" : "needs_review",
      feedback: null,
      missingConcepts: []
    };
  });

  return { mappings, unmatchedAnswers: parsed.unmatchedAnswerIds };
}

function baseUnansweredMapping(q: Question): Mapping {
  return {
    questionId: q.id,
    answerIds: [],
    confidence: 0,
    status: "unanswered",
    reason: "No matching answer found.",
    score: 0,
    maxMarks: q.maxMarks,
    correctness: "unanswered",
    feedback: null,
    missingConcepts: []
  };
}

export async function gradeMappings(
  questions: Question[],
  answers: Answer[],
  mappings: Mapping[]
): Promise<Mapping[]> {
  const answerById = new Map(answers.map((a) => [a.id, a]));
  const gradableItems = mappings
    .filter((m) => m.status !== "unanswered")
    .map((m) => {
      const q = questions.find((qq) => qq.id === m.questionId)!;
      const answerText = m.answerIds
        .map((id) => answerById.get(id)?.text ?? "")
        .join("\n")
        .slice(0, 1000);
      return {
        questionId: m.questionId,
        questionText: q.text,
        maxMarks: q.maxMarks,
        studentAnswer: answerText || null
      };
    });

  if (gradableItems.length === 0) return mappings;

  const raw = await generateStructuredJSON<unknown>({
    prompt: buildGradingPrompt(JSON.stringify(gradableItems))
  });
  const parsed = GradingSchema.parse(raw);
  const gradeByQuestion = new Map(parsed.grades.map((g) => [g.questionId, g]));

  return mappings.map((m) => {
    const g = gradeByQuestion.get(m.questionId);
    if (!g) return m;
    return {
      ...m,
      score: g.score,
      correctness: g.correctness as Correctness,
      feedback: g.feedback,
      missingConcepts: g.missingConcepts,
      status:
        m.status === "unanswered"
          ? "unanswered"
          : g.confidence < 0.5
          ? "needs_review"
          : m.status
    };
  });
}

export function buildSummary(questions: Question[], mappings: Mapping[]): AssessmentSummary {
  const totalQuestions = questions.length;
  const answered = mappings.filter((m) => m.status !== "unanswered").length;
  const unanswered = totalQuestions - answered;
  const matched = mappings.filter((m) => m.status === "matched").length;
  const needsReview = mappings.filter((m) => m.status === "needs_review").length;

  const totalScore = mappings.reduce((sum, m) => sum + (m.score ?? 0), 0);
  const totalMaxScore = questions.reduce((sum, q) => sum + (q.maxMarks ?? 0), 0);
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  return {
    totalQuestions,
    answered,
    unanswered,
    matched,
    unmatched: 0, // filled in by caller with unmatchedAnswers.length
    needsReview,
    totalScore,
    totalMaxScore,
    percentage
  };
}

export async function runFullPipeline(params: {
  questionPaper: FilePart;
  answerSheet: FilePart;
  grade: boolean;
}): Promise<AssessmentResult> {
  const questions = await extractQuestions(params.questionPaper);
  const answers = await extractAnswers(params.answerSheet);
  const { mappings: mappedOnly, unmatchedAnswers } = await mapQuestionsToAnswers(
    questions,
    answers
  );
  const mappings = params.grade
    ? await gradeMappings(questions, answers, mappedOnly)
    : mappedOnly;

  const summary = buildSummary(questions, mappings);
  summary.unmatched = unmatchedAnswers.length;

  return {
    status: "completed",
    questions,
    answers,
    unmatchedAnswers,
    mappings,
    summary
  };
}
