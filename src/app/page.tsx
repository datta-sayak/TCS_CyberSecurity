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

type AppState = "idle" | "loading" | "result" | "error";

export default function Home() {
  const [reportText, setReportText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const canAnalyze = reportText.trim().length > 50 && apiKey.trim().length > 10;

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
    <main className="min-h-screen bg-[#0a0f1e] text-slate-200 pb-16">
      {/* ── Header ── */}
      <header className="border-b border-blue-900/50 bg-[#0d1630]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Cyber Threat Report Summarizer
              </h1>
              <p className="text-xs text-blue-400 font-medium tracking-wide">
                IOC Extractor &amp; ATT&amp;CK Mapper · Powered by Gemini
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* ── Input Panel ── */}
        <section className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">
            📋 Paste Threat Report
          </h2>

          {/* API Key */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-[#111d40] border border-blue-900/50 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-20"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your key is never stored — stays in memory for this session only.
            </p>
          </div>

          {/* Textarea */}
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste your threat intelligence report here (plain text)…&#10;&#10;Example: On March 14, the attacker leveraged CVE-2024-1234 to gain initial access via a phishing email. The malware beacon contacted 192.168.1.100 and evil-c2.ru. SHA256: d3adb33fd3adb33fd3adb33fd3adb33fd3adb33fd3adb33fd3adb33fd3adb33f"
            rows={10}
            className="w-full bg-[#111d40] border border-blue-900/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono leading-relaxed"
          />

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500">
              {reportText.length.toLocaleString()} characters
              {reportText.length > 0 && ` · ~${Math.round(reportText.split(/\s+/).length / 4)} tokens est.`}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || state === "loading"}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-blue-900/40 hover:shadow-blue-500/30 flex items-center gap-2"
            >
              {state === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>⚡ Analyze with Gemini</>
              )}
            </button>
          </div>
        </section>

        {/* ── Loading ── */}
        {state === "loading" && <LoadingSpinner />}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="bg-red-950/40 border border-red-700/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-2">Analysis Failed</h3>
                <pre className="text-xs text-red-300/80 whitespace-pre-wrap font-mono bg-red-950/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {errorMsg}
                </pre>
                <button
                  onClick={handleAnalyze}
                  className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  🔄 Retry
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
            <div className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-300">Export Results</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {maliciousCount} malicious IOC{maliciousCount !== 1 ? "s" : ""} ·{" "}
                  {result.techniques.length} ATT&amp;CK technique
                  {result.techniques.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                disabled={maliciousCount === 0}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                📊 Export IOCs as CSV
              </button>
              <button
                onClick={handleExportStix}
                disabled={maliciousCount === 0 && result.techniques.length === 0}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                📦 Export as STIX 2.1
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

