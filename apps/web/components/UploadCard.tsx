"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { ACCEPTED_MIME_TYPES, formatFileSize, validateFile } from "@/lib/fileUtils";

export interface SelectedFile {
  file: File;
  pageCount: number;
}

interface UploadCardProps {
  label: string;
  accentLabel: string; // e.g. "Question Paper"
  selected: SelectedFile | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error: string | null;
}

export default function UploadCard({
  label,
  accentLabel,
  selected,
  onSelect,
  onRemove,
  error
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onSelect(files[0]);
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => !selected && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !selected) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-xl3 border-2 border-dashed bg-white transition-colors ${
          selected ? "border-transparent" : dragActive ? "border-veda-orange bg-veda-orangeSoft/40" : "border-gray-200"
        } ${error ? "border-veda-red" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {selected ? (
          <div className="flex items-center gap-3 p-4">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-veda-redSoft text-veda-red">
              <FileText size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{selected.file.name}</p>
              <p className="text-xs text-veda-sub">
                {formatFileSize(selected.file.size)} • {selected.pageCount} Page
                {selected.pageCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              aria-label={`Remove ${selected.file.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="grid place-items-center w-7 h-7 rounded-full bg-gray-800 text-white shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-gray-100 text-veda-ink">
              <Upload size={18} />
            </span>
            <p className="text-sm font-semibold">
              Upload <span className="text-veda-orange">{accentLabel}</span>
            </p>
            <p className="text-xs text-veda-sub">Max 10MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-veda-red">{error}</p>}
    </div>
  );
}
