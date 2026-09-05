import type { AnalysisIoc } from "./gemini";

export function exportIocsCsv(iocs: AnalysisIoc[]): string {
  const malicious = iocs.filter((i) => i.verdict === "malicious");
  const header = ["value", "type", "verdict", "confidence", "source_sentence"];
  const rows = malicious.map((i) =>
    [i.value, i.type, i.verdict, i.confidence, `"${i.source_sentence.replace(/"/g, '""')}"`].join(
      ","
    )
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

