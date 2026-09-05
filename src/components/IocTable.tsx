"use client";

import { useState } from "react";
import type { AnalysisIoc } from "@/lib/gemini";

const VERDICT_CONFIG = {
  malicious:     { label: "MALICIOUS",     bg: "bg-red-900/40",     border: "border-red-700/50",     text: "text-red-300",     dot: "bg-red-400",     icon: "🔴" },
  benign_example:{ label: "BENIGN",        bg: "bg-emerald-900/30", border: "border-emerald-700/40", text: "text-emerald-300", dot: "bg-emerald-400", icon: "🟢" },
  uncertain:     { label: "UNCERTAIN",     bg: "bg-yellow-900/30",  border: "border-yellow-700/40",  text: "text-yellow-300",  dot: "bg-yellow-400",  icon: "🟡" },
};

const TYPE_ICON: Record<string, string> = {
  ip:     "🌐",
  domain: "🔗",
  hash:   "🔒",
  cve:    "⚠️",
};

const CONF_DOT: Record<string, string> = {
  high:   "bg-emerald-400 shadow-[0_0_5px_#34d399]",
  medium: "bg-yellow-400 shadow-[0_0_5px_#fbbf24]",
  low:    "bg-slate-500",
};

type FilterVerdict = "all" | "malicious" | "benign_example" | "uncertain";

interface Props { iocs: AnalysisIoc[] }

export default function IocTable({ iocs }: Props) {
  const [filter, setFilter] = useState<FilterVerdict>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const filtered = filter === "all" ? iocs : iocs.filter((i) => i.verdict === filter);

  const counts = {
    all: iocs.length,
    malicious: iocs.filter((i) => i.verdict === "malicious").length,
    benign_example: iocs.filter((i) => i.verdict === "benign_example").length,
    uncertain: iocs.filter((i) => i.verdict === "uncertain").length,
  };

  return (
    <div className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-5 shadow-xl h-full">
      <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">
        🔎 IOC Analysis
      </h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "malicious", "benign_example", "uncertain"] as FilterVerdict[]).map((v) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === v
                ? "bg-blue-600 text-white"
                : "bg-[#111d40] text-slate-400 hover:text-slate-200"
            }`}
          >
            {v === "all" ? "All" : v === "benign_example" ? "Benign" : v.charAt(0).toUpperCase() + v.slice(1)}
            <span className="ml-1.5 opacity-70">({counts[v]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-8">No IOCs match this filter</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-blue-900/30">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#111d40] border-b border-blue-900/30">
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide">Type</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide">Value</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide">Verdict</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ioc, idx) => {
                const vc = VERDICT_CONFIG[ioc.verdict] ?? VERDICT_CONFIG.uncertain;
                const isExpanded = expandedRow === idx;

                return (
                  <>
                    <tr
                      key={idx}
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      className="border-b border-blue-900/20 hover:bg-blue-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <span title={ioc.type}>{TYPE_ICON[ioc.type] ?? "📌"}</span>
                        <span className="ml-1.5 text-slate-400 uppercase">{ioc.type}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-200 max-w-[180px] truncate" title={ioc.value}>
                        {ioc.value}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${vc.bg} ${vc.border} ${vc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vc.dot}`} />
                          {vc.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${CONF_DOT[ioc.confidence] ?? CONF_DOT.low}`} />
                          <span className="text-slate-400 capitalize">{ioc.confidence}</span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${idx}-expanded`} className="bg-[#0a0f1e]">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide mb-1">Source Sentence</div>
                          <p className="text-slate-300 text-xs italic leading-relaxed">
                            &ldquo;{ioc.source_sentence}&rdquo;
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

