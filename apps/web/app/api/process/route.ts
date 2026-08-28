import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/pipeline";
import { DEMO_ASSESSMENT } from "@/lib/demoData";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ProcessRequestBody {
  questionPaper: { mimeType: string; base64: string };
  answerSheet: { mimeType: string; base64: string };
  grade?: boolean;
}

export async function POST(req: NextRequest) {
  let body: ProcessRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", error: "Malformed request body." },
      { status: 400 }
    );
  }

  if (!body?.questionPaper?.base64 || !body?.answerSheet?.base64) {
    return NextResponse.json(
      { status: "error", error: "Both questionPaper and answerSheet files are required." },
      { status: 400 }
    );
  }

  // Demo fallback: only triggers when no key is configured, so the
  // interface remains testable end-to-end without a paid/free key.
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ...DEMO_ASSESSMENT, isDemo: true });
  }

  try {
    const result = await runFullPipeline({
      questionPaper: body.questionPaper,
      answerSheet: body.answerSheet,
      grade: body.grade ?? true
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      {
        status: "error",
        error:
          err?.message ||
          "The AI pipeline failed. Please check the uploaded files and try again."
      },
      { status: 500 }
    );
  }
}
