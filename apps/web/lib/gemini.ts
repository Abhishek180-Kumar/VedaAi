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

  async function attempt(extraInstruction?: string): Promise<T> {
    const finalParts = extraInstruction
      ? [...parts.slice(0, -1), { text: params.prompt + "\n\n" + extraInstruction }]
      : parts;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: finalParts }],
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

    return JSON.parse(cleaned) as T;
  }

  // Gemini occasionally returns malformed/truncated JSON. Retry once with a
  // stricter instruction before giving up, per the "attempt safe recovery"
  // requirement — never trust raw AI output blindly.
  try {
    return await attempt();
  } catch (firstErr) {
    try {
      return await attempt(
        "IMPORTANT: Your previous response was not valid JSON. Return ONLY a single valid JSON object, with no markdown fences, no commentary, and no trailing commas."
      );
    } catch (secondErr: any) {
      throw new Error(
        `Gemini returned invalid JSON after retry: ${secondErr?.message || "unknown parse error"}`
      );
    }
  }
}
