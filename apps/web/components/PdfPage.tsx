"use client";

import { useEffect, useRef, useState } from "react";

interface PdfPageProps {
  fileUrl: string;
  mimeType: string;
  pageNumber: number; // 1-indexed
  zoom: number; // 1 = 100%
  onPageCount?: (count: number) => void;
  onRenderedSize?: (size: { width: number; height: number }) => void;
}

// Lazily loads pdfjs-dist only in the browser to avoid SSR issues.
// The worker is bundled locally (not loaded from a CDN) so it can't be
// blocked by ad-blockers, offline mode, or restrictive network policies.
let pdfjsLibPromise: Promise<any> | null = null;
function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.js",
        import.meta.url
      ).toString();
      return lib;
    });
  }
  return pdfjsLibPromise;
}

export default function PdfPage({
  fileUrl,
  mimeType,
  pageNumber,
  zoom,
  onPageCount,
  onRenderedSize
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(true);
  const isPdf = mimeType === "application/pdf";

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!isPdf) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const pdfjsLib = await loadPdfJs();
      const doc = await pdfjsLib.getDocument(fileUrl).promise;
      if (cancelled) return;
      onPageCount?.(doc.numPages);

      const page = await doc.getPage(Math.min(pageNumber, doc.numPages));
      const viewport = page.getViewport({ scale: 1.5 * zoom });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled) return;
      onRenderedSize?.({ width: viewport.width, height: viewport.height });
      setLoading(false);
    }

    render().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, pageNumber, zoom, isPdf]);

  if (!isPdf) {
    return (
      <img
        ref={imgRef}
        src={fileUrl}
        alt={`Page ${pageNumber}`}
        onLoad={(e) => {
          const el = e.currentTarget;
          onPageCount?.(1);
          onRenderedSize?.({ width: el.clientWidth, height: el.clientHeight });
        }}
        style={{ width: `${zoom * 100}%` }}
        className="block mx-auto"
      />
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 grid place-items-center text-xs text-veda-sub">
          Loading page…
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
    </div>
  );
}
