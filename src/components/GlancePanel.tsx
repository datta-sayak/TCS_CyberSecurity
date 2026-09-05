"use client";

import type { AnalysisResult } from "@/lib/gemini";

const SEVERITY_CONFIG = {
  low:      { label: "LOW",      color: "text-[#aaaaaa]", bg: "bg-[#1a1a1a]", border: "border-[#333333]", dot: "bg-[#888888]", glow: "#888888" },
  medium:   { label: "MEDIUM",   color: "text-[#cccccc]", bg: "bg-[#1a1a1a]", border: "border-[#555555]", dot: "bg-[#cccccc]", glow: "#aaaaaa" },
  high:     { label: "HIGH",     color: "text-white",     bg: "bg-[#1a1a1a]", border: "border-[#888888]", dot: "bg-white",     glow: "#cccccc" },
  critical: { label: "CRITICAL", color: "text-[#cc4444]", bg: "bg-[#1a0a0a]", border: "border-[#4a1a1a]", dot: "bg-[#cc4444]", glow: "#cc4444" },
};

interface Props { result: AnalysisResult }

export default function GlancePanel({ result }: Props) {
  const sev = SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.medium;
  const maliciousCount = result.iocs.filter((i) => i.verdict === "malicious").length;
  const uncertainCount = result.iocs.filter((i) => i.verdict === "uncertain").length;

  return (
    <section className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-[#aaaaaa] uppercase tracking-widest mb-5">
        Threat at a Glance
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Left: severity + counters */}
        <div className="flex flex-col gap-4">
          {/* Severity Badge */}
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${sev.bg} ${sev.border} w-fit glow-pulse`}
            style={{ color: sev.glow }}
          >
            <div className={`w-3 h-3 rounded-full ${sev.dot} shadow-[0_0_8px_currentColor]`} />
            <div>
              <div className="text-xs text-[#888888] uppercase tracking-wider font-medium">Severity</div>
              <div className={`text-2xl font-black tracking-wide ${sev.color}`}>{sev.label}</div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2">
            <StatPill label="Malicious IOCs" value={maliciousCount} color="text-[#cc4444]" />
            <StatPill label="Uncertain" value={uncertainCount} color="text-[#aaaaaa]" />
            <StatPill label="Techniques" value={result.techniques.length} color="text-white" />
            <StatPill label="Actions" value={result.recommendations.length} color="text-[#888888]" />
          </div>
        </div>

        {/* Right: executive summary */}
        <div className="bg-[#0a0a0a] border border-[#333333] rounded-xl p-5">
          <div className="text-xs text-[#888888] uppercase tracking-wider font-medium mb-2">
            Executive Summary
          </div>
          <p className="text-[#e5e5e5] text-sm leading-relaxed">{result.executive_summary}</p>
        </div>
      </div>
    </section>
  );
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333333] rounded-lg px-3 py-2">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-[#666666]">{label}</span>
    </div>
  );
}

