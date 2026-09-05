"use client";

export default function LoadingSpinner() {
  return (
    <div className="bg-[#0d1630] border border-blue-900/40 rounded-2xl p-12 flex flex-col items-center gap-6">
      {/* Layered spinner rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-900/30" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-blue-400/60 border-b-transparent border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:0.8s]" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-blue-300 font-semibold text-lg">Analyzing Threat Report…</p>
        <p className="text-slate-500 text-sm max-w-xs">
          Gemini is extracting IOCs, mapping ATT&amp;CK techniques, and assessing severity
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {["Extract IOCs", "Map Techniques", "Assess Severity", "Generate Recommendations"].map(
          (step, i) => (
            <div
              key={step}
              className="flex items-center gap-1.5 bg-[#111d40] border border-blue-900/30 rounded-full px-3 py-1"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <span className="text-xs text-slate-400">{step}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

