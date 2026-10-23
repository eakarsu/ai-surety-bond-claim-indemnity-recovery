// Feature-pack helpers: pure, offline, no provider calls. Preserves false/0/empty via labelled sections.
export function displayValue(value) {
  if (value === false) return "false";
  if (value === 0) return "0";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
export function labelledSections(row, labels) {
  const keys = labels || Object.keys(row || {});
  return keys.map((key) => ({ label: String(key), value: displayValue(row?.[key]), raw: row?.[key] ?? null }));
}
export function filterRecords(rows, { q = "", status = "", risk = "" } = {}) {
  const needle = String(q).trim().toLowerCase();
  return (rows || []).filter((row) => {
    if (status && String(row.status ?? row.state ?? "") !== status) return false;
    if (risk && String(row.risk ?? "") !== risk) return false;
    if (!needle) return true;
    return Object.values(row || {}).some((v) => displayValue(v).toLowerCase().includes(needle) || (v && typeof v === "object" && JSON.stringify(v).toLowerCase().includes(needle)));
  });
}
export function recordsToCsv(rows) {
  const list = rows || [];
  if (!list.length) return "";
  const cols = [...new Set(list.flatMap((r) => Object.keys(r || {})))];
  const esc = (v) => { const s = v && typeof v === "object" ? JSON.stringify(v) : displayValue(v) === "—" ? "" : displayValue(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(","), ...list.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function fallbackAnalysis(domainLabel, rows, kind = "priorities") {
  const list = rows || [];
  const open = list.filter((r) => !["Closed", "Approved", "closed"].includes(String(r.status ?? r.state ?? "")));
  const high = list.filter((r) => ["High", "Critical"].includes(String(r.risk ?? "")));
  const total = list.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const kinds = {
    priorities: ["Priority queue", `Open records needing attention first in ${domainLabel}, ordered by risk as stored.`],
    "evidence-gaps": ["Evidence gaps", `Records in ${domainLabel} with empty, false, or zero fields that still need labelled review.`],
    summary: ["Portfolio summary", `Deterministic counts over your own ${domainLabel} records. No provider was called.`],
  };
  const [title, detail] = kinds[kind] || kinds.priorities;
  return {
    aiGenerated: false, source: "deterministic-fallback", label: "Deterministic fallback — not AI-generated", kind,
    headline: `${title} — ${domainLabel}`,
    sections: [
      { title, detail },
      { title: "Records reviewed", detail: `${list.length} record(s) reviewed; ${open.length} open; ${high.length} high/critical risk.` },
      { title: "Next step", detail: open.length ? `Start with: ${open.slice(0, 3).map((r) => r.reference || r.title || r.id).join(", ")}` : "No open records. Export the list for audit evidence." },
    ],
    metrics: [
      { label: "Records reviewed", value: displayValue(list.length) },
      { label: "Open records", value: displayValue(open.length) },
      { label: "High / critical risk", value: displayValue(high.length) },
      { label: "Total amount", value: displayValue(total) },
    ],
    actions: ["Validate source evidence for the first open record.", "Assign an accountable owner.", "Record approval and closure evidence."],
  };
}
export const FALLBACK_KINDS = ["priorities", "evidence-gaps", "summary"];
