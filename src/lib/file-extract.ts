/**
 * file-extract.ts
 * Client-side text extraction for all supported report formats.
 * Called from FileUploader; no server required.
 */

export type SupportedMime =
  | "text/plain"
  | "text/markdown"
  | "text/html"
  | "text/csv"
  | "application/json"
  | "application/rtf"
  | "text/rtf"
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const ACCEPTED_EXTENSIONS =
  ".txt,.md,.markdown,.html,.htm,.csv,.json,.rtf,.pdf,.docx";

export const ACCEPTED_MIMES = [
  "text/plain",
  "text/markdown",
  "text/html",
  "text/csv",
  "application/json",
  "application/rtf",
  "text/rtf",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ── helpers ──────────────────────────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file, "utf-8");
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function stripHtml(html: string): string {
  // Remove scripts/styles first, then strip tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripRtf(rtf: string): string {
  // Remove RTF control words, groups, and binary blobs
  return rtf
    .replace(/\{\*?\\[^{}]+\}|\\[a-z]+\d*[ ]?/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function extractPdf(file: File): Promise<string> {
  // Dynamic import so pdfjs is not bundled unless needed
  const pdfjs = await import("pdfjs-dist");
  // Point worker to CDN to avoid bundler complexity
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const buffer = await readAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item.str ?? "") : ""))
      .join(" ");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

// ── main export ───────────────────────────────────────────────────────────────

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type.toLowerCase();

  // PDF
  if (mime === "application/pdf" || ext === "pdf") {
    return extractPdf(file);
  }

  // DOCX
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return extractDocx(file);
  }

  // HTML / HTM — read as text then strip tags
  if (mime === "text/html" || ext === "html" || ext === "htm") {
    const raw = await readAsText(file);
    return stripHtml(raw);
  }

  // RTF — read as text then strip control words
  if (mime === "application/rtf" || mime === "text/rtf" || ext === "rtf") {
    const raw = await readAsText(file);
    return stripRtf(raw);
  }

  // Plain text, Markdown, JSON, CSV — read as-is
  if (
    ["txt", "md", "markdown", "json", "csv"].includes(ext) ||
    mime.startsWith("text/") ||
    mime === "application/json"
  ) {
    return readAsText(file);
  }

  throw new Error(
    `Unsupported file type: .${ext || mime}. Supported: TXT, MD, HTML, CSV, JSON, RTF, PDF, DOCX`
  );
}
