# VedaAI — AI Assessment Extraction & Answer Mapping

A teacher uploads a question paper and one student's handwritten answer sheet.
The app extracts every question, extracts the handwritten answers, maps each
answer to its question, highlights the **exact region** of the answer on the
sheet, and optionally grades the answer with AI feedback.

## Monorepo layout

```
vedaai-assignment/
├── apps/
│   └── web/                 # Next.js 14 app (App Router, TypeScript, Tailwind)
│       ├── app/
│       │   ├── page.tsx             # upload → processing → mapping UI (state machine)
│       │   ├── layout.tsx
│       │   ├── globals.css
│       │   └── api/process/route.ts # orchestrates the AI pipeline
│       ├── components/              # Sidebar, Headers, UploadCard, QuestionList,
│       │                             # AnswerSheetViewer, HighlightOverlay, PdfPage, …
│       ├── lib/
│       │   ├── gemini.ts            # Gemini client (server-only)
│       │   ├── prompts.ts           # extraction / mapping / grading prompts
│       │   ├── pipeline.ts          # extraction → mapping → grading orchestration
│       │   ├── validation.ts        # zod schemas that validate all AI output
│       │   ├── demoData.ts          # fallback dataset used only w/o an API key
│       │   └── fileUtils.ts         # client-side validation, base64 encoding
│       └── types/assessment.ts      # shared domain model (Question, Answer, Mapping…)
├── .env.example
└── README.md
```

## Approach

**Core flow:** Question Extraction → Answer Extraction → Answer Mapping → Grading/Feedback.

1. **Upload** — teacher uploads a question paper and an answer sheet (PDF or
   image, ≤10MB each), with drag & drop, validation, and remove.
2. **Extraction** — both files are sent to Gemini as inline document parts.
   - The question-paper prompt returns every question in printed order, in
     strict JSON, treating labelled sub-parts (`11(a)`, `11(b)`) as separate
     entries and preserving original numbering.
   - The answer-sheet prompt returns every handwritten answer region, with
     the student's own label if visible, a transcription, and one bounding
     box **per page it appears on** (so answers can span multiple pages).
   - All bounding boxes are **normalized (0–1)** relative to the page, not
     raw pixels — this is what lets the highlight stay correctly positioned
     at any zoom level or screen size.
3. **Mapping** — a third Gemini call matches questions to answers using a
   priority order: explicit question label → sub-part label → semantic
   similarity → layout/sequence context. Every question gets an entry even
   if unanswered; every answer that can't be confidently matched is listed
   separately as "unmatched."
4. **Grading (optional)** — a fourth call scores each matched answer against
   its question's max marks and returns short, specific feedback.
5. **Mapping screen** — clicking a question selects it, jumps the answer
   viewer to the correct page, and draws an orange highlight box exactly
   around that answer (green boxes mark other answers visible on the same
   page). This works identically on the mobile `Questions`/`Answer Sheet`
   toggle view.

All AI output is validated with `zod` before it reaches the UI — malformed
or out-of-range data is rejected rather than silently rendered.

## AI model / API used

- **Gemini 2.5 Flash** (`gemini-2.5-flash`) via `@google/genai`, called
  server-side only from Next.js API routes.
- Chosen because it natively understands PDFs and images (no separate OCR
  step needed) and has a free tier suitable for this assignment.
- The API key is read from `GEMINI_API_KEY` on the server and is **never**
  exposed to the browser (no `NEXT_PUBLIC_` prefix anywhere).

## Local setup

```bash
npm install
cp .env.example apps/web/.env.local
# edit apps/web/.env.local and paste your key from https://aistudio.google.com/apikey
npm run dev
```

Open http://localhost:3000.

> If `GEMINI_API_KEY` is not set, the app still works end-to-end using a
> clearly-separated demo dataset (`lib/demoData.ts`) so the interface can be
> reviewed without a key. This fallback is never used once a key is present.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it into Vercel, set the **root directory to `apps/web`**.
3. Add the environment variable `GEMINI_API_KEY` in the Vercel project
   settings.
4. Deploy. Test the production URL in an incognito window (upload flow,
   mobile view, and highlighting).

## Assumptions & limitations

- No authentication and no database, per the assignment's constraints —
  everything is in-memory for the duration of one processing request.
- Handwriting recognition accuracy depends entirely on Gemini's vision
  model; very messy handwriting or low-quality scans will lower mapping
  confidence (surfaced in the UI as "Needs review").
- Bounding boxes are model-estimated, not pixel-perfect OCR coordinates —
  they're good enough to highlight the right region but may not hug every
  letter exactly.
- The question-paper document itself is not rendered in the viewer (only
  its extracted text) — per the provided design, only the answer sheet is
  shown with highlighting.
- PDF rendering uses `pdfjs-dist` in the browser; very large PDFs (many
  pages, huge scans) will be slower to render.
- Grading is AI-generated and explicitly not claimed to be error-free —
  it's shown as an aid with a confidence indicator, matching the
  assignment's "optional" scope for grading.

## Edge cases implemented

| Edge case | Behaviour |
|---|---|
| **Out-of-order answers** | The mapping engine uses semantic similarity and layout context, so if a student answers Q3 before Q2, the answers still map correctly. |
| **Unanswered questions** | Questions with no matching answer show a "Not answered" badge, 0 marks, and a "No answer found" note in the expanded card. |
| **Unmatched answers** | Handwritten regions that cannot be confidently mapped to any question appear in an "Unmatched Answers" section at the bottom of the question list. |
| **Multi-page answers** | A single answer can span multiple pages; the extraction prompt returns multiple `segments` and the viewer shows the correct highlight on each page. |
| **Sub-parts (11a, 11b)** | Labeled sub-parts are extracted as independent `Question` entries with their own labels, bboxes, and max marks. |
| **Low-confidence mapping** | If the AI is unsure, the mapping gets `status: "needs_review"` and the UI shows the confidence percentage. |
| **Demo fallback (no API key)** | When `GEMINI_API_KEY` is absent, the app uses a built-in demo dataset so the full UI can be reviewed without a key. |
