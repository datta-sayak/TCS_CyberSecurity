"use client";

import type { AnalysisResult } from "@/lib/gemini";

const SEVERITY_CONFIG = {
  low:      { label: "LOW",      color: "text-emerald-300", bg: "bg-emerald-900/30", border: "border-emerald-600/40", dot: "bg-emerald-400", glow: "#34d399" },
  medium:   { label: "MEDIUM",   color: "text-yellow-300",  bg: "bg-yellow-900/30",  border: "border-yellow-600/40",  dot: "bg-yellow-400",  glow: "#fbbf24" },
  high:     { label: "HIGH",     color: "text-orange-300",  bg: "bg-orange-900/30",  border: "border-orange-600/40",  dot: "bg-orange-400",  glow: "#fb923c" },
  critical: { label: "CRITICAL", color: "text-red-300",     bg: "bg-red-900/30",     border: "border-red-600/40",     dot: "bg-red-400",     glow: "#f87171" },
};

interface Props { result: AnalysisResult }

export default function GlancePanel({ result }: Props) {
  const sev = SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.medium;
  const maliciousCount = result.iocs.filter((i) => i.verdict === "malicious").length;
  const uncertainCount = result.iocs.filter((i) => i.verdict === "uncertain").length;

  return (
    <section className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-5">
        🎯 Threat at a Glance
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
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Severity</div>
              <div className={`text-2xl font-black tracking-wide ${sev.color}`}>{sev.label}</div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2">
            <StatPill icon="🔴" value={maliciousCount} label="Malicious IOCs" color="text-red-400" />
            <StatPill icon="❓" value={uncertainCount} label="Uncertain" color="text-yellow-400" />
            <StatPill icon="🧩" value={result.techniques.length} label="Techniques" color="text-blue-400" />
            <StatPill icon="💡" value={result.recommendations.length} label="Actions" color="text-emerald-400" />
          </div>
        </div>

        {/* Right: executive summary */}
        <div className="bg-[#111d40] border border-blue-900/30 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
            Executive Summary
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">{result.executive_summary}</p>
        </div>
      </div>
    </section>
  );
}

function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#111d40] border border-blue-900/30 rounded-lg px-3 py-2">
      <span>{icon}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

