"use client";

import { useState } from "react";
import type { AnalysisIoc } from "@/lib/gemini";

const VERDICT_CONFIG = {
  malicious:      { label: "MALICIOUS", bg: "bg-[#1a0a0a]", border: "border-[#4a1a1a]", text: "text-[#cc4444]", dot: "bg-[#cc4444]" },
  benign_example: { label: "BENIGN",    bg: "bg-[#0a1a0a]", border: "border-[#1a3a1a]", text: "text-[#aaaaaa]", dot: "bg-[#888888]" },
  uncertain:      { label: "UNCERTAIN", bg: "bg-[#1a1a0a]", border: "border-[#3a3a1a]", text: "text-[#cccccc]", dot: "bg-[#666666]" },
};

const TYPE_LABEL: Record<string, string> = {
  ip:     "IP",
  domain: "Domain",
  hash:   "Hash",
  cve:    "CVE",
};

const CONF_DOT: Record<string, string> = {
  high:   "bg-white",
  medium: "bg-[#888888]",
  low:    "bg-[#444444]",
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
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl h-full">
      <h2 className="text-sm font-semibold text-[#aaaaaa] uppercase tracking-widest mb-4">
        IOC Analysis
      </h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "malicious", "benign_example", "uncertain"] as FilterVerdict[]).map((v) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === v
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#333333]"
            }`}
          >
            {v === "all" ? "All" : v === "benign_example" ? "Benign" : v.charAt(0).toUpperCase() + v.slice(1)}
            <span className="ml-1.5 opacity-70">({counts[v]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center text-[#555555] text-sm py-8">No IOCs match this filter</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#222222]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#333333]">
                <th className="text-left px-3 py-2.5 text-[#888888] font-semibold uppercase tracking-wide">Type</th>
                <th className="text-left px-3 py-2.5 text-[#888888] font-semibold uppercase tracking-wide">Value</th>
                <th className="text-left px-3 py-2.5 text-[#888888] font-semibold uppercase tracking-wide">Verdict</th>
                <th className="text-left px-3 py-2.5 text-[#888888] font-semibold uppercase tracking-wide">Conf.</th>
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
                      className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <span className="text-[#888888] uppercase font-mono">{TYPE_LABEL[ioc.type] ?? ioc.type}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[#e5e5e5] max-w-[180px] truncate" title={ioc.value}>
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
                          <span className="text-[#666666] capitalize">{ioc.confidence}</span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${idx}-expanded`} className="bg-[#0a0a0a]">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="text-[10px] text-[#888888] font-semibold uppercase tracking-wide mb-1">Source Sentence</div>
                          <p className="text-[#cccccc] text-xs italic leading-relaxed">
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

