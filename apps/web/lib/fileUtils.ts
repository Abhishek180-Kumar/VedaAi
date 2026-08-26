export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp"
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)}MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)}KB`;
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return "Invalid file type. Please upload PDF, PNG, JPG, JPEG, or WEBP.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File exceeds the 10MB limit.";
  }
  if (file.size === 0) {
    return "This file appears to be empty or corrupted.";
  }
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data URL prefix, keep raw base64
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export async function estimatePdfPageCount(file: File): Promise<number> {
  if (file.type !== "application/pdf") return 1;
  try {
    const buf = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buf);
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    return matches?.length || 1;
  } catch {
    return 1;
  }
}
