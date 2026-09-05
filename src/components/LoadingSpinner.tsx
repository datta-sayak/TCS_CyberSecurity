"use client";

export default function LoadingSpinner() {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-12 flex flex-col items-center gap-6">
      {/* Layered spinner rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-[#222222]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-[#555555] border-b-transparent border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:0.8s]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-white font-semibold text-lg">Analyzing Threat Report…</p>
        <p className="text-[#666666] text-sm max-w-xs">
          Gemini is extracting IOCs, mapping ATT&amp;CK techniques, and assessing severity
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {["Extract IOCs", "Map Techniques", "Assess Severity", "Generate Recommendations"].map(
          (step, i) => (
            <div
              key={step}
              className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333333] rounded-full px-3 py-1"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <span className="text-xs text-[#888888]">{step}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

