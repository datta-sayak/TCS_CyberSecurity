"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { z } from "zod";
import {
  extractTextFromFile,
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIMES,
} from "@/lib/file-extract";

// ── Zod File Schema ────────────────────────────────────────────────────────────
// Validates the raw File object before we spend any time parsing it.

const ACCEPTED_EXT_LIST = ACCEPTED_EXTENSIONS.split(",").map((e) => e.replace(".", "").toLowerCase());
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileSchema = z
  .instanceof(File, { message: "Expected a File object" })
  .refine((f) => f.size > 0, {
    message: "File is empty (0 bytes).",
  })
  .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, {
    message: `File exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`,
  })
  .refine(
    (f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return ACCEPTED_MIMES.includes(f.type) || ACCEPTED_EXT_LIST.includes(ext);
    },
    {
      message: `Unsupported file type. Accepted: ${ACCEPTED_EXT_LIST.join(", ")}.`,
    }
  );

// ── Types & Helpers ────────────────────────────────────────────────────────────

interface Props {
  onTextExtracted: (text: string, fileName: string) => void;
  disabled?: boolean;
}

type UploadState = "idle" | "parsing" | "done" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FORMAT_BADGES = ["TXT", "MD", "PDF", "DOCX", "HTML", "JSON", "CSV", "RTF"];

// ── Component ──────────────────────────────────────────────────────────────────

export default function FileUploader({ onTextExtracted, disabled }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setUploadState("parsing");
      setErrorMsg("");
      setFileName(file.name);
      setFileSize(file.size);

      // ── Zod file validation ──
      const validation = FileSchema.safeParse(file);
      if (!validation.success) {
        setUploadState("error");
        setErrorMsg(validation.error.issues[0].message);
        return;
      }

      try {
        const text = await extractTextFromFile(file);

        if (!text.trim()) {
          setUploadState("error");
          setErrorMsg("The file appears to be empty or could not be parsed.");
          return;
        }

        // Warn if content is very large (still process it, let gemini.ts enforce the hard limit)
        if (text.length > 80_000) {
          setErrorMsg(
            `⚠️ Extracted ${(text.length / 1000).toFixed(0)} KB of text — this may exceed the analysis limit. Consider trimming the report.`
          );
        }

        setCharCount(text.length);
        setUploadState("done");
        onTextExtracted(text, file.name);
      } catch (err) {
        setUploadState("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    },
    [onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleReset = () => {
    setUploadState("idle");
    setFileName("");
    setFileSize(0);
    setCharCount(0);
    setErrorMsg("");
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && uploadState !== "parsing" && inputRef.current?.click()}
        className={[
          "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer select-none",
          isDragOver
            ? "border-neutral-500 bg-neutral-900/20"
            : uploadState === "done"
            ? "border-neutral-800/50 bg-[#111111]"
            : uploadState === "error"
            ? "border-red-700/50 bg-red-950/20"
            : "border-neutral-800/40 bg-[#111111] hover:border-neutral-700/50 hover:bg-[#1a1a1a]",
          (disabled || uploadState === "parsing") ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleChange}
          disabled={disabled || uploadState === "parsing"}
          className="hidden"
        />

        {/* ── Idle ── */}
        {uploadState === "idle" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-800/30 border border-neutral-700/40 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {isDragOver ? "Drop file here" : "Drop your report or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Max {MAX_FILE_SIZE_MB} MB · PDF, DOCX, TXT, MD, HTML, JSON, CSV, RTF
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {FORMAT_BADGES.map((fmt) => (
                <span key={fmt} className="px-2 py-0.5 bg-neutral-800/30 border border-neutral-800/40 rounded text-[10px] font-mono text-neutral-400">
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Parsing ── */}
        {uploadState === "parsing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-6">
            <div className="w-8 h-8 border-2 border-neutral-800/50 border-t-neutral-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">
              Parsing <span className="text-white font-mono">{fileName}</span>…
            </p>
          </div>
        )}

        {/* ── Done ── */}
        {uploadState === "done" && (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-neutral-800/30 border border-neutral-700/40 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{fileName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatBytes(fileSize)} · {charCount.toLocaleString()} characters extracted
              </p>
              {/* Show soft warning if oversized (non-blocking) */}
              {errorMsg && (
                <p className="text-xs text-yellow-400 mt-1 leading-relaxed">{errorMsg}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-xs text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {uploadState === "error" && (
          <div className="flex items-start gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-700/40 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">Upload Failed</p>
              <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Reset button */}
      {(uploadState === "done" || uploadState === "error") && (
        <button
          onClick={(e) => { e.stopPropagation(); handleReset(); }}
          className="text-xs text-slate-500 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.87"/>
          </svg>
          Upload a different file
        </button>
      )}
    </div>
  );
}
