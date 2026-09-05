export type IocType = "ip" | "domain" | "hash" | "cve";

export interface CandidateIoc {
  value: string;
  type: IocType;
}

const IPV4_RE =
  /\b(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\b/g;

// Avoid matching plain numbers or overly short tokens
const DOMAIN_RE =
  /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|gov|edu|mil|co|uk|de|ru|cn|info|biz|int|xyz|me|tv|onion|local|internal)\b/gi;

const MD5_RE = /\b[0-9a-fA-F]{32}\b/g;
const SHA1_RE = /\b[0-9a-fA-F]{40}\b/g;
const SHA256_RE = /\b[0-9a-fA-F]{64}\b/g;
const CVE_RE = /\bCVE-\d{4}-\d{4,7}\b/gi;

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function extractCandidateIocs(text: string): CandidateIoc[] {
  const results: CandidateIoc[] = [];
  const seen = new Set<string>();

  const add = (value: string, type: IocType) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ value, type });
    }
  };

  // CVEs first (highest precision)
  for (const m of dedupe([...(text.match(CVE_RE) ?? [])])) add(m.toUpperCase(), "cve");

  // Hashes (longest match wins — check 64 before 40 before 32)
  const sha256Matches = dedupe([...(text.match(SHA256_RE) ?? [])]);
  const sha1Matches = dedupe(
    [...(text.match(SHA1_RE) ?? [])].filter((h) => !sha256Matches.includes(h))
  );
  const md5Matches = dedupe(
    [...(text.match(MD5_RE) ?? [])].filter(
      (h) => !sha256Matches.includes(h) && !sha1Matches.includes(h)
    )
  );

  for (const h of sha256Matches) add(h, "hash");
  for (const h of sha1Matches) add(h, "hash");
  for (const h of md5Matches) add(h, "hash");

  // IPs
  for (const ip of dedupe([...(text.match(IPV4_RE) ?? [])])) add(ip, "ip");

  // Domains (exclude things that look like IPs already captured)
  const ipSet = new Set(results.filter((r) => r.type === "ip").map((r) => r.value));
  for (const d of dedupe([...(text.match(DOMAIN_RE) ?? [])])) {
    if (!ipSet.has(d)) add(d.toLowerCase(), "domain");
  }

  return results;
}

