"use client";

import { useState } from "react";
import { extractCandidateIocs } from "@/lib/ioc-regex";
import { analyzeReport, type AnalysisResult } from "@/lib/gemini";
import { exportIocsCsv, downloadText } from "@/lib/csv";
import { generateStixBundle } from "@/lib/stix";
import GlancePanel from "@/components/GlancePanel";
import AttackTimeline from "@/components/AttackTimeline";
import IocTable from "@/components/IocTable";
import Recommendations from "@/components/Recommendations";
import LoadingSpinner from "@/components/LoadingSpinner";
import FileUploader from "@/components/FileUploader";

type AppState = "idle" | "loading" | "result" | "error";

export default function Home() {
  const [reportText, setReportText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const canAnalyze = reportText.trim().length > 50 && apiKey.trim().length > 10;

  function handleTextExtracted(text: string, fileName: string) {
    setReportText(text);
    setUploadedFileName(fileName);
    // Reset any previous results when a new file is uploaded
    setResult(null);
    setState("idle");
    setErrorMsg("");
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setState("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const candidates = extractCandidateIocs(reportText);
      const analysis = await analyzeReport(reportText, candidates, apiKey.trim());
      setResult(analysis);
      setState("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  function handleExportCsv() {
    if (!result) return;
    const csv = exportIocsCsv(result.iocs);
    downloadText(csv, "malicious-iocs.csv", "text/csv");
  }

  function handleExportStix() {
    if (!result) return;
    const bundle = generateStixBundle(result.iocs, result.techniques, result.executive_summary);
    downloadText(bundle, "threat-report.stix2.json", "application/json");
  }

  const maliciousCount = result?.iocs.filter((i) => i.verdict === "malicious").length ?? 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] pb-16">
      {/* ── Header ── */}
      <header className="border-b border-[#222222] bg-[#111111] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Cyber Threat Report Summarizer
              </h1>
              <p className="text-xs text-[#888888] font-medium tracking-wide">
                IOC Extractor &amp; ATT&amp;CK Mapper · Powered by Gemini
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* ── Input Panel ── */}
        <section className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-[#aaaaaa] uppercase tracking-widest mb-5">
            Upload Threat Report
          </h2>

          {/* API Key */}
          <div className="mb-5">
            <label className="block text-xs text-[#888888] mb-1.5 font-medium">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-2.5 text-sm text-[#e5e5e5] placeholder-[#444444] focus:outline-none focus:ring-2 focus:ring-white font-mono pr-20"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888888] hover:text-white transition-colors"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-[#555555] mt-1">
              Your key is never stored — stays in memory for this session only.
            </p>
          </div>

          {/* File Uploader */}
          <FileUploader
            onTextExtracted={handleTextExtracted}
            disabled={state === "loading"}
          />

          {/* Status + Analyze row */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-[#666666]">
              {reportText.length > 0 ? (
                <>
                  {uploadedFileName && (
                    <span className="font-mono text-[#888888] mr-2">{uploadedFileName}</span>
                  )}
                  {reportText.length.toLocaleString()} chars
                  {` · ~${Math.round(reportText.split(/\s+/).length / 4)} tokens est.`}
                </>
              ) : (
                "No report loaded"
              )}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || state === "loading"}
              className="px-6 py-2.5 bg-white hover:bg-[#e5e5e5] disabled:opacity-30 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
            >
              {state === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>Analyze with Gemini</>
              )}
            </button>
          </div>
        </section>

        {/* ── Loading ── */}
        {state === "loading" && <LoadingSpinner />}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="bg-[#1a0a0a] border border-[#4a1a1a] rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#cc4444] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex-1">
                <h3 className="text-[#cc4444] font-semibold mb-2">Analysis Failed</h3>
                <pre className="text-xs text-[#aa3333] whitespace-pre-wrap font-mono bg-[#150808] rounded-lg p-3 max-h-48 overflow-y-auto">
                  {errorMsg}
                </pre>
                <button
                  onClick={handleAnalyze}
                  className="mt-3 px-4 py-2 bg-[#cc4444] hover:bg-[#aa3333] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {state === "result" && result && (
          <>
            {/* 1. Threat at a Glance */}
            <GlancePanel result={result} />

            {/* 2. Attack Narrative Timeline */}
            {result.techniques.length > 0 && (
              <AttackTimeline techniques={result.techniques} />
            )}

            {/* 3. IOC Table + Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <IocTable iocs={result.iocs} />
              </div>
              <div className="lg:col-span-2">
                <Recommendations recommendations={result.recommendations} />
              </div>
            </div>

            {/* 4. Export Row */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#e5e5e5]">Export Results</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  {maliciousCount} malicious IOC{maliciousCount !== 1 ? "s" : ""} ·{" "}
                  {result.techniques.length} ATT&amp;CK technique
                  {result.techniques.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                disabled={maliciousCount === 0}
                className="px-5 py-2.5 bg-white hover:bg-[#e5e5e5] disabled:opacity-30 disabled:cursor-not-allowed text-black font-semibold rounded-xl text-sm transition-colors"
              >
                Export IOCs as CSV
              </button>
              <button
                onClick={handleExportStix}
                disabled={maliciousCount === 0 && result.techniques.length === 0}
                className="px-5 py-2.5 bg-[#222222] hover:bg-[#333333] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors border border-[#444444]"
              >
                Export as STIX 2.1
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
