export const QUESTION_EXTRACTION_PROMPT = `You are a strict document-extraction engine for a question paper (PDF or images).

Extract EVERY printed question in exact visual/printed order, preserving the original numbering exactly as printed.

Rules:
- Treat labelled sub-parts as SEPARATE questions. Example: "11 (a)" and "11 (b)" must become two independent entries with labels "11(a)" and "11(b)".
- Do not merge sub-parts into one question. Do not invent missing questions. Do not reorder.
- If a question has no explicit marks printed, set maxMarks to null.
- "page" is the 1-indexed page number the question appears on.
- "bbox" is the normalized bounding box (0..1 relative to page width/height) of the question's text block on the page. If you cannot determine it confidently, return null for bbox.

Return ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "questions": [
    {
      "label": "11(a)",
      "parentNumber": "11",
      "subPart": "a",
      "text": "full question text",
      "page": 1,
      "bbox": { "x": 0.1, "y": 0.2, "width": 0.8, "height": 0.06 } or null,
      "maxMarks": 2 or null
    }
  ]
}`;

export const ANSWER_EXTRACTION_PROMPT = `You are a strict document-extraction engine for a student's handwritten answer sheet (PDF or images).

Identify every distinct answer region and transcribe the handwriting as accurately as possible.

Rules:
- Preserve any visible question label the student wrote (e.g. "Q1", "2.", "11 (a)") in "questionLabelHint". If none is visible, set it to null.
- If an answer continues across multiple pages, return multiple entries in "segments" (one per page), not multiple answers.
- Do not merge unrelated answers into one entry.
- "segments[].page" is 1-indexed. "segments[].bbox" is normalized (0..1) relative to that page's width/height, covering just that answer's handwritten region — not the whole page.
- "confidence" (0..1) reflects how confident you are in the transcription and region.

Return ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "answers": [
    {
      "questionLabelHint": "Q2" or null,
      "text": "transcribed answer text",
      "segments": [
        { "page": 1, "bbox": { "x": 0.1, "y": 0.3, "width": 0.7, "height": 0.15 } }
      ],
      "confidence": 0.9
    }
  ]
}`;

export function buildMappingPrompt(questionsJson: string, answersJson: string) {
  return `You are matching extracted exam questions to a student's extracted handwritten answers.

QUESTIONS (in printed order):
${questionsJson}

ANSWERS (in the order found on the answer sheet, may be out of order relative to questions):
${answersJson}

Matching priority (apply in this order):
1. Explicit question label match (e.g. student wrote "Q7" -> question labelled "7").
2. Explicit sub-part label match (e.g. "11(a)" -> question labelled "11(a)").
3. Semantic similarity between question text and transcribed answer.
4. Layout/sequence context (previous/next answers, page proximity) when labels are ambiguous or missing.

Rules:
- Every question must appear exactly once in "mappings", even if unanswered (answerIds: [], status: "unanswered").
- Do not force a low-confidence match. If uncertain, use status "needs_review" with a lower confidence, or leave unmatched.
- List any answer id that does not confidently belong to any question in "unmatchedAnswerIds".
- confidence is 0..1. Use >= 0.85 for confident matches, 0.5-0.84 for "needs_review", below 0.5 leave the question unanswered/answer unmatched.
- Give a short "reason" for each mapping decision.

Return ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "mappings": [
    {
      "questionId": "q_1",
      "answerIds": ["a_3"],
      "confidence": 0.95,
      "status": "matched",
      "reason": "Student explicitly labelled this answer Q1"
    }
  ],
  "unmatchedAnswerIds": ["a_9"]
}`;
}

export function buildGradingPrompt(pairsJson: string) {
  return `You are grading a student's exam answers.

For each item below you are given the question text, max marks, and the student's transcribed answer (or null if unanswered).
Evaluate correctness using understanding of the subject matter, not keyword matching alone.

ITEMS:
${pairsJson}

For each item return:
- score: a number between 0 and maxMarks (use null if maxMarks is null; use 0 if unanswered).
- correctness: one of "correct" | "partially_correct" | "incorrect" | "unanswered" | "needs_review".
- feedback: one short, constructive sentence (max ~30 words) written to the student.
- missingConcepts: short array of key concepts missing from the answer, empty array if none.
- confidence: 0..1 confidence in this grading.

Return ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "grades": [
    {
      "questionId": "q_1",
      "score": 2,
      "correctness": "correct",
      "feedback": "Correct and complete.",
      "missingConcepts": [],
      "confidence": 0.9
    }
  ]
}`;
}
