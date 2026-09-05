"use client";

interface Props { recommendations: string[] }

export default function Recommendations({ recommendations }: Props) {
  return (
    <div className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-5 shadow-xl h-full">
      <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">
        💡 Recommendations
      </h2>

      {recommendations.length === 0 ? (
        <p className="text-slate-500 text-sm">No recommendations generated.</p>
      ) : (
        <ol className="space-y-3">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 group">
              {/* Number */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700/60 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300 mt-0.5">
                {idx + 1}
              </div>
              {/* Text */}
              <p className="text-sm text-slate-300 leading-relaxed group-hover:text-slate-100 transition-colors">
                {rec}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

