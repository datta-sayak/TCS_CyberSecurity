"use client";

import { useState } from "react";
import type { Technique } from "@/lib/gemini";

const CONF_DOT: Record<string, string> = {
  high:   "bg-white",
  medium: "bg-[#888888]",
  low:    "bg-[#444444]",
};

interface Props { techniques: Technique[] }

export default function AttackTimeline({ techniques }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const sorted = [...techniques].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <section className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-[#aaaaaa] uppercase tracking-widest mb-2">
        Attack Narrative Timeline
      </h2>
      <p className="text-xs text-[#555555] mb-6">
        Techniques ordered by chronological attack flow · Click a node to expand evidence
      </p>

      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start min-w-max gap-0">
          {sorted.map((technique, idx) => {
            const isLast = idx === sorted.length - 1;
            const isExpanded = expanded === idx;

            return (
              <div key={idx} className="flex items-start">
                {/* Node */}
                <div className="flex flex-col items-center" style={{ width: 180 }}>
                  {/* Step number */}
                  <div className="w-7 h-7 rounded-full bg-[#222222] border-2 border-[#555555] flex items-center justify-center text-xs font-bold text-white mb-2 z-10">
                    {technique.sequence_order}
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : idx)}
                    className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl p-3 text-left transition-all duration-200 hover:border-[#555555] hover:bg-[#222222] focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {/* Tactic label */}
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#888888] mb-1">
                      {technique.tactic}
                    </div>

                    {/* Technique ID */}
                    <div className="font-mono text-xs font-bold text-white mb-1">
                      {technique.id}
                    </div>

                    {/* Name */}
                    <div className="text-xs font-medium text-[#cccccc] leading-tight line-clamp-2">
                      {technique.name}
                    </div>

                    {/* Confidence dot */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`w-2 h-2 rounded-full ${CONF_DOT[technique.confidence] ?? CONF_DOT.low}`} />
                      <span className="text-[10px] text-[#666666] capitalize">{technique.confidence} confidence</span>
                    </div>
                  </button>

                  {/* Expanded source sentence */}
                  {isExpanded && (
                    <div className="w-full mt-2 bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-xs text-[#cccccc] leading-relaxed">
                      <div className="text-[#888888] font-semibold mb-1 text-[10px] uppercase tracking-wide">
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
                      className="text-[#555555] flex-shrink-0"
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

