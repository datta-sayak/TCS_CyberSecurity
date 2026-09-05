"use client";

import { useState } from "react";
import type { Technique } from "@/lib/gemini";

const TACTIC_COLOR: Record<string, string> = {
  "Initial Access":         "from-violet-900/60 to-violet-800/40 border-violet-600/50 text-violet-300",
  "Execution":              "from-red-900/60 to-red-800/40 border-red-600/50 text-red-300",
  "Persistence":            "from-orange-900/60 to-orange-800/40 border-orange-600/50 text-orange-300",
  "Privilege Escalation":   "from-amber-900/60 to-amber-800/40 border-amber-600/50 text-amber-300",
  "Defense Evasion":        "from-yellow-900/60 to-yellow-800/40 border-yellow-600/50 text-yellow-300",
  "Credential Access":      "from-pink-900/60 to-pink-800/40 border-pink-600/50 text-pink-300",
  "Discovery":              "from-sky-900/60 to-sky-800/40 border-sky-600/50 text-sky-300",
  "Lateral Movement":       "from-cyan-900/60 to-cyan-800/40 border-cyan-600/50 text-cyan-300",
  "Collection":             "from-teal-900/60 to-teal-800/40 border-teal-600/50 text-teal-300",
  "Command and Control":    "from-emerald-900/60 to-emerald-800/40 border-emerald-600/50 text-emerald-300",
  "Exfiltration":           "from-lime-900/60 to-lime-800/40 border-lime-600/50 text-lime-300",
  "Impact":                 "from-rose-900/60 to-rose-800/40 border-rose-600/50 text-rose-300",
};

const DEFAULT_COLOR = "from-blue-900/60 to-blue-800/40 border-blue-600/50 text-blue-300";

const CONF_DOT: Record<string, string> = {
  high:   "bg-emerald-400 shadow-[0_0_6px_#34d399]",
  medium: "bg-yellow-400 shadow-[0_0_6px_#fbbf24]",
  low:    "bg-slate-500",
};

interface Props { techniques: Technique[] }

export default function AttackTimeline({ techniques }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const sorted = [...techniques].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <section className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-2">
        ⚔️ Attack Narrative Timeline
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Techniques ordered by chronological attack flow · Click a node to expand evidence
      </p>

      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start min-w-max gap-0">
          {sorted.map((technique, idx) => {
            const isLast = idx === sorted.length - 1;
            const isExpanded = expanded === idx;
            const colorClass = TACTIC_COLOR[technique.tactic] ?? DEFAULT_COLOR;

            return (
              <div key={idx} className="flex items-start">
                {/* Node */}
                <div className="flex flex-col items-center" style={{ width: 180 }}>
                  {/* Step number */}
                  <div className="w-7 h-7 rounded-full bg-blue-700 border-2 border-blue-400 flex items-center justify-center text-xs font-bold text-white mb-2 z-10 shadow-[0_0_10px_#3b82f6]">
                    {technique.sequence_order}
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : idx)}
                    className={`w-full bg-gradient-to-b ${colorClass} border rounded-xl p-3 text-left transition-all duration-200 hover:brightness-125 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    {/* Tactic label */}
                    <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mb-1">
                      {technique.tactic}
                    </div>

                    {/* Technique ID */}
                    <div className="font-mono text-xs font-bold text-white mb-1">
                      {technique.id}
                    </div>

                    {/* Name */}
                    <div className="text-xs font-medium text-slate-200 leading-tight line-clamp-2">
                      {technique.name}
                    </div>

                    {/* Confidence dot */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`w-2 h-2 rounded-full ${CONF_DOT[technique.confidence] ?? CONF_DOT.low}`} />
                      <span className="text-[10px] text-slate-400 capitalize">{technique.confidence} confidence</span>
                    </div>
                  </button>

                  {/* Expanded source sentence */}
                  {isExpanded && (
                    <div className="w-full mt-2 bg-[#111d40] border border-blue-900/30 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
                      <div className="text-blue-400 font-semibold mb-1 text-[10px] uppercase tracking-wide">
                        Evidence
                      </div>
                      <p className="italic">&ldquo;{technique.source_sentence}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div className="flex items-center" style={{ height: 44, marginTop: 30 }}>
                    <div className="timeline-connector" style={{ width: 32 }} />
                    <svg
                      width="8"
                      height="12"
                      viewBox="0 0 8 12"
                      className="text-blue-500 flex-shrink-0"
                    >
                      <path d="M0 0L8 6L0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

