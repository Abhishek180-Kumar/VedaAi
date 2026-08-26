import { z } from "zod";

const unit = z.number().min(-0.05).max(1.05); // small tolerance for model noise

export const BBoxSchema = z.object({
  x: unit,
  y: unit,
  width: unit,
  height: unit
});

export const RawQuestionSchema = z.object({
  label: z.string(),
  parentNumber: z.string(),
  subPart: z.string().nullable(),
  text: z.string(),
  page: z.number().int().min(1),
  bbox: BBoxSchema.nullable(),
  maxMarks: z.number().nullable()
});

export const QuestionExtractionSchema = z.object({
  questions: z.array(RawQuestionSchema)
});

export const RawAnswerSegmentSchema = z.object({
  page: z.number().int().min(1),
  bbox: BBoxSchema
});

export const RawAnswerSchema = z.object({
  questionLabelHint: z.string().nullable(),
  text: z.string(),
  segments: z.array(RawAnswerSegmentSchema).min(1),
  confidence: z.number().min(0).max(1)
});

export const AnswerExtractionSchema = z.object({
  answers: z.array(RawAnswerSchema)
});

export const RawMappingSchema = z.object({
  questionId: z.string(),
  answerIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  status: z.enum(["matched", "unanswered", "needs_review"]),
  reason: z.string().nullable()
});

export const MappingSchema = z.object({
  mappings: z.array(RawMappingSchema),
  unmatchedAnswerIds: z.array(z.string())
});

export const RawGradeSchema = z.object({
  questionId: z.string(),
  score: z.number().nullable(),
  correctness: z.enum([
    "correct",
    "partially_correct",
    "incorrect",
    "unanswered",
    "needs_review"
  ]),
  feedback: z.string().nullable(),
  missingConcepts: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export const GradingSchema = z.object({
  grades: z.array(RawGradeSchema)
});
