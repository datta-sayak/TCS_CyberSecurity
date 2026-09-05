import type { AnalysisIoc, Technique } from "./gemini";

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function stixPatternForIoc(ioc: AnalysisIoc): string {
  switch (ioc.type) {
    case "ip":
      return `[ipv4-addr:value = '${ioc.value}']`;
    case "domain":
      return `[domain-name:value = '${ioc.value}']`;
    case "hash":
      if (ioc.value.length === 64) return `[file:hashes.SHA-256 = '${ioc.value}']`;
      if (ioc.value.length === 40) return `[file:hashes.SHA-1 = '${ioc.value}']`;
      return `[file:hashes.MD5 = '${ioc.value}']`;
    case "cve":
      return `[vulnerability:name = '${ioc.value}']`;
    default:
      return `[artifact:mime_type = 'unknown']`;
  }
}

export function generateStixBundle(
  iocs: AnalysisIoc[],
  techniques: Technique[],
  summary: string
): string {
  const maliciousIocs = iocs.filter((i) => i.verdict === "malicious");
  const bundleId = `bundle--${uuid()}`;
  const reportId = `report--${uuid()}`;
  const ts = now();

  const indicatorObjects = maliciousIocs.map((ioc) => {
    const id = `indicator--${uuid()}`;
    return {
      type: "indicator",
      spec_version: "2.1",
      id,
      created: ts,
      modified: ts,
      name: `${ioc.type.toUpperCase()}: ${ioc.value}`,
      description: ioc.source_sentence,
      pattern: stixPatternForIoc(ioc),
      pattern_type: "stix",
      valid_from: ts,
      indicator_types: ["malicious-activity"],
      confidence: ioc.confidence === "high" ? 85 : ioc.confidence === "medium" ? 50 : 15,
    };
  });

  const attackPatternObjects = techniques.map((t) => {
    const id = `attack-pattern--${uuid()}`;
    return {
      type: "attack-pattern",
      spec_version: "2.1",
      id,
      created: ts,
      modified: ts,
      name: t.name,
      description: t.source_sentence,
      external_references: [
        {
          source_name: "mitre-attack",
          url: `https://attack.mitre.org/techniques/${t.id}/`,
          external_id: t.id,
        },
      ],
      kill_chain_phases: [
        {
          kill_chain_name: "mitre-attack",
          phase_name: t.tactic.toLowerCase().replace(/\s+/g, "-"),
        },
      ],
    };
  });

  const allObjectIds = [
    ...indicatorObjects.map((o) => o.id),
    ...attackPatternObjects.map((o) => o.id),
  ];

  const reportObject = {
    type: "report",
    spec_version: "2.1",
    id: reportId,
    created: ts,
    modified: ts,
    name: "Cyber Threat Report Analysis",
    description: summary,
    published: ts,
    report_types: ["threat-report"],
    object_refs: allObjectIds,
  };

  const bundle = {
    type: "bundle",
    id: bundleId,
    objects: [...indicatorObjects, ...attackPatternObjects, reportObject],
  };

  return JSON.stringify(bundle, null, 2);
}

