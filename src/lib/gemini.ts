import type { CandidateIoc } from "./ioc-regex";

export interface AnalysisIoc {
  value: string;
  type: "ip" | "domain" | "hash" | "cve";
  verdict: "malicious" | "benign_example" | "uncertain";
  confidence: "low" | "medium" | "high";
  source_sentence: string;
}

export interface Technique {
  id: string;
  name: string;
  tactic: string;
  sequence_order: number;
  confidence: "low" | "medium" | "high";
  source_sentence: string;
}

export interface AnalysisResult {
  executive_summary: string;
  severity: "low" | "medium" | "high" | "critical";
  iocs: AnalysisIoc[];
  techniques: Technique[];
  recommendations: string[];
}

const SYSTEM_PROMPT = `You are a senior threat intelligence analyst. You will receive a raw threat report and a list of candidate IOCs pre-extracted by regex.

Your job is to output ONLY a single valid JSON object — no markdown fences, no commentary, no trailing text — conforming exactly to this schema:

{
  "executive_summary": "<2-3 sentence plain-text summary of the threat>",
  "severity": "<one of: low | medium | high | critical>",
  "iocs": [
    {
      "value": "<exact IOC string>",
      "type": "<one of: ip | domain | hash | cve>",
      "verdict": "<one of: malicious | benign_example | uncertain>",
      "confidence": "<one of: low | medium | high>",
      "source_sentence": "<exact sentence from the report where this IOC appears>"
    }
  ],
  "techniques": [
    {
      "id": "<ATT&CK technique ID, e.g. T1059>",
      "name": "<ATT&CK technique name>",
      "tactic": "<one of the standard ATT&CK tactic names: Initial Access | Execution | Persistence | Privilege Escalation | Defense Evasion | Credential Access | Discovery | Lateral Movement | Collection | Command and Control | Exfiltration | Impact>",
      "sequence_order": <integer representing chronological position in the attack flow, starting at 1>,
      "confidence": "<one of: low | medium | high>",
      "source_sentence": "<exact sentence from the report that evidences this technique>"
    }
  ],
  "recommendations": ["<short actionable step>", ...]
}

CRITICAL RULES:
1. For every IOC, you MUST assign a verdict. Reports often cite known-good IPs/domains for contrast or reference — mark those as benign_example. Mark confirmed C2/dropper/malicious infrastructure as malicious. Use uncertain only when genuinely ambiguous.
2. Only map ATT&CK techniques when there is clear textual evidence in the report. Always cite the exact source sentence. Always assign a tactic from the list above.
3. sequence_order must reflect the actual chronological order of the attack as described in the report — NOT the order techniques are mentioned in the text.
4. Output ONLY the JSON object. No markdown. No explanation. No preamble.`;

function buildUserMessage(reportText: string, candidates: CandidateIoc[]): string {
  const candidateList =
    candidates.length > 0
      ? candidates.map((c) => `  - ${c.value} (${c.type})`).join("\n")
      : "  (none found by regex)";

  return `THREAT REPORT:
---
${reportText}
---

CANDIDATE IOCs PRE-EXTRACTED BY REGEX (validate and classify each):
${candidateList}

Now produce the JSON analysis.`;
}

export async function analyzeReport(
  reportText: string,
  candidates: CandidateIoc[],
  apiKey: string
): Promise<AnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserMessage(reportText, candidates) }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip potential markdown fences just in case
  const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from Gemini:\n${cleaned.slice(0, 500)}`);
  }

  // Basic shape validation
  if (
    typeof parsed.executive_summary !== "string" ||
    !["low", "medium", "high", "critical"].includes(parsed.severity) ||
    !Array.isArray(parsed.iocs) ||
    !Array.isArray(parsed.techniques) ||
    !Array.isArray(parsed.recommendations)
  ) {
    throw new Error("Gemini response failed schema validation");
  }

  // Sort techniques by sequence_order
  parsed.techniques = parsed.techniques.sort((a, b) => a.sequence_order - b.sequence_order);

  return parsed;
}

