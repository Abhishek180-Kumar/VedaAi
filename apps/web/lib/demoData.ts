// DEMO DATA — used ONLY when GEMINI_API_KEY is not configured, so the
// interface can still be evaluated end-to-end. This is clearly separated
// from the real AI pipeline in lib/pipeline.ts and is never used when a
// key is present.
import type { AssessmentResult } from "@/types/assessment";

export const DEMO_ASSESSMENT: AssessmentResult = {
  status: "completed",
  questions: [
    {
      id: "q_1",
      label: "1",
      parentNumber: "1",
      subPart: null,
      text: "Which of the following organelles is primarily involved in photosynthesis?",
      page: 1,
      bbox: { x: 0.08, y: 0.08, width: 0.84, height: 0.07 },
      maxMarks: 2,
      order: 0
    },
    {
      id: "q_2",
      label: "2",
      parentNumber: "2",
      subPart: null,
      text: "Which blood vessel carries blood away from the heart?",
      page: 1,
      bbox: { x: 0.08, y: 0.18, width: 0.84, height: 0.07 },
      maxMarks: 2,
      order: 1
    },
    {
      id: "q_3",
      label: "3",
      parentNumber: "3",
      subPart: null,
      text: "Describe the flow of blood through the human heart starting from the right atrium and ending at the aorta, include the names of valves crossed.",
      page: 1,
      bbox: { x: 0.08, y: 0.28, width: 0.84, height: 0.1 },
      maxMarks: 5,
      order: 2
    },
    {
      id: "q_4",
      label: "4",
      parentNumber: "4",
      subPart: null,
      text: "Explain the structural differences between palisade mesophyll and spongy mesophyll and state how each structure aids its function in the leaf.",
      page: 1,
      bbox: { x: 0.08, y: 0.42, width: 0.84, height: 0.1 },
      maxMarks: 5,
      order: 3
    },
    {
      id: "q_11a",
      label: "11(a)",
      parentNumber: "11",
      subPart: "a",
      text: "Describe the process of transpiration in plants in two to three sentences and name two environmental factors that increase its rate.",
      page: 2,
      bbox: { x: 0.08, y: 0.1, width: 0.84, height: 0.1 },
      maxMarks: 4,
      order: 4
    },
    {
      id: "q_11b",
      label: "11(b)",
      parentNumber: "11",
      subPart: "b",
      text: "Suggest one practical measure to help a wilting plant recover.",
      page: 2,
      bbox: { x: 0.08, y: 0.22, width: 0.84, height: 0.06 },
      maxMarks: 3,
      order: 5
    },
    {
      id: "q_13",
      label: "13",
      parentNumber: "13",
      subPart: null,
      text: "A student's question with no matching handwritten answer on the sheet, to demonstrate the unanswered state.",
      page: 2,
      bbox: { x: 0.08, y: 0.32, width: 0.84, height: 0.08 },
      maxMarks: 4,
      order: 6
    }
  ],
  answers: [
    {
      id: "a_1",
      text: "The process mainly occurs in the chloroplast of the plant cell. It has two main stages: 1. Light reaction - captures light energy. 2. Dark reaction - uses energy to make glucose.",
      questionLabelHint: "Q1",
      confidence: 0.95,
      segments: [{ page: 1, bbox: { x: 0.06, y: 0.42, width: 0.88, height: 0.16 } }]
    },
    {
      id: "a_4",
      text: "Transpiration is the loss of water vapour from the leaves of a plant through stomata, driven by sunlight and temperature. It continues onto the next page.",
      questionLabelHint: "11 a",
      confidence: 0.88,
      segments: [
        { page: 2, bbox: { x: 0.06, y: 0.5, width: 0.88, height: 0.14 } },
        { page: 3, bbox: { x: 0.06, y: 0.08, width: 0.88, height: 0.1 } }
      ]
    },
    {
      id: "a_3",
      text: "Photosynthesis is the process used by green plants and some other organisms to convert light energy into chemical energy: 6CO2 + 6H2O -> C6H12O6 + 6O2.",
      questionLabelHint: "Q2",
      confidence: 0.9,
      segments: [{ page: 1, bbox: { x: 0.06, y: 0.06, width: 0.88, height: 0.3 } }]
    },
    {
      id: "a_2",
      text: "Arteries carry oxygen-rich blood away from the heart to the rest of the body.",
      questionLabelHint: "Q99",
      confidence: 0.4,
      segments: [{ page: 1, bbox: { x: 0.06, y: 0.62, width: 0.88, height: 0.1 } }]
    }
  ],
  unmatchedAnswers: ["a_2"],
  mappings: [
    {
      questionId: "q_1",
      answerIds: ["a_1"],
      confidence: 0.95,
      status: "matched",
      reason: "Explicit Q1 label matched.",
      score: 2,
      maxMarks: 2,
      correctness: "correct",
      feedback: "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis. Keep it up!",
      missingConcepts: []
    },
    {
      questionId: "q_2",
      answerIds: ["a_3"],
      confidence: 0.7,
      status: "needs_review",
      reason: "Semantic match — answer describes photosynthesis equation rather than blood vessels.",
      score: 0,
      maxMarks: 2,
      correctness: "incorrect",
      feedback: "This answer describes photosynthesis, not blood vessels. Please re-check the answer sheet region.",
      missingConcepts: ["arteries", "away from heart"]
    },
    {
      questionId: "q_3",
      answerIds: [],
      confidence: 0,
      status: "unanswered",
      reason: "No matching answer found.",
      score: 0,
      maxMarks: 5,
      correctness: "unanswered",
      feedback: null,
      missingConcepts: []
    },
    {
      questionId: "q_4",
      answerIds: [],
      confidence: 0,
      status: "unanswered",
      reason: "No matching answer found.",
      score: 0,
      maxMarks: 5,
      correctness: "unanswered",
      feedback: null,
      missingConcepts: []
    },
    {
      questionId: "q_11a",
      answerIds: ["a_4"],
      confidence: 0.91,
      status: "matched",
      reason: "Explicit sub-part label '11 a' matched.",
      score: 4,
      maxMarks: 4,
      correctness: "correct",
      feedback: "Clear and accurate explanation with two valid environmental factors.",
      missingConcepts: []
    },
    {
      questionId: "q_11b",
      answerIds: [],
      confidence: 0,
      status: "unanswered",
      reason: "No matching answer found.",
      score: 0,
      maxMarks: 3,
      correctness: "unanswered",
      feedback: null,
      missingConcepts: []
    },
    {
      questionId: "q_13",
      answerIds: [],
      confidence: 0,
      status: "unanswered",
      reason: "No matching answer found.",
      score: 0,
      maxMarks: 4,
      correctness: "unanswered",
      feedback: null,
      missingConcepts: []
    }
  ],
  summary: {
    totalQuestions: 7,
    answered: 3,
    unanswered: 4,
    matched: 2,
    unmatched: 1,
    needsReview: 1,
    totalScore: 6,
    totalMaxScore: 25,
    percentage: 24
  }
};
