import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface FilePart {
  mimeType: string;
  base64: string;
}

/**
 * Calls Gemini with one or more file parts + a text prompt, and expects a
 * single JSON object back. Strips markdown code fences defensively and
 * throws if the result isn't valid JSON — callers must handle errors.
 */
export async function generateStructuredJSON<T>(params: {
  prompt: string;
  files?: FilePart[];
  temperature?: number;
}): Promise<T> {
  const ai = getClient();

  const parts: any[] = [];
  for (const f of params.files || []) {
    parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
  }
  parts.push({ text: params.prompt });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      temperature: params.temperature ?? 0.2,
      responseMimeType: "application/json"
    }
  });

  const raw = response.text ?? "";
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Gemini returned invalid JSON. First 500 chars: ${cleaned.slice(0, 500)}`
    );
  }
}
