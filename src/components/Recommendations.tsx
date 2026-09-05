"use client";

interface Props { recommendations: string[] }

export default function Recommendations({ recommendations }: Props) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl h-full">
      <h2 className="text-sm font-semibold text-[#aaaaaa] uppercase tracking-widest mb-4">
        Recommendations
      </h2>

      {recommendations.length === 0 ? (
        <p className="text-[#555555] text-sm">No recommendations generated.</p>
      ) : (
        <ol className="space-y-3">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 group">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#222222] border border-[#444444] flex items-center justify-center text-xs font-bold text-[#aaaaaa] mt-0.5">
                {idx + 1}
              </div>
              <p className="text-sm text-[#cccccc] leading-relaxed group-hover:text-white transition-colors">
                {rec}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
