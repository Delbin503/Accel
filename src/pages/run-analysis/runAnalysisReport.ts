import { toast } from "sonner";
import type {
  AnalysisResult, AnalysisVerdict, RunFailure, RunState, RunStatus,
} from "@/types/runAnalysis";

/* Run Analysis Report — the document Run Analysis → result → "Export PDF"
   opens in a new tab and sends to the print dialog.

   It follows the transactional email look (centred wordmark, Inter, the
   #F4F4F6 detail cards, the #F6F5F4 footer band and the #FE5C01 accent) so a
   report and an email from Accel read as one family. It is a print document,
   not an email, so it uses a normal stylesheet and page-break control.

   The same builder produces the reference copy in the email gallery
   (prototypes/PRD_Email_Templates/templates/run-analysis-report.html) —
   regenerate that file after changing the markup here. */

export interface RunReportModel {
  modelName: string;
  status: RunStatus;
  runState?: RunState;
  failure?: RunFailure;
  result: AnalysisResult;
}

export interface RunReportInput {
  runId?: string;
  name: string;
  vlmName: string;
  startedBy?: string;
  completedAt?: string;
  runtime?: string;
  verdict: AnalysisVerdict;
  verdictAt?: string;
  models: RunReportModel[];
  exportedAt: string;
}

const LOGO = `<svg width="112" height="43" viewBox="10 8 110 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Accel" style="display:block;"><path d="M32.4233 7.64709L12.3529 41.2141H24.3408C28.2487 31.3687 32.1165 27.548 40.5882 22.3275L32.4233 7.64709Z" fill="#FE5C01"/><path d="M53.3717 26.2863C38.6929 28.3662 32.7562 33.384 25.3305 47.6471C28.9353 33.8212 33.1949 28.603 44.0521 24.0595C47.9968 24.51 50.0182 25.0238 53.3717 26.2863Z" fill="#FE5C01"/><path d="M37.5367 34.7811L40.4233 40.5543H50.815L45.1243 30.7399C42.2301 31.7791 40.5668 32.6701 37.5367 34.7811Z" fill="#FE5C01"/><path d="M67.7596 40.505H63.9796L63.8066 37.9109H57.7784L56.4937 40.505H52.8619L61.5584 23.7791H66.4748L67.7596 40.505ZM63.6831 35.1438L63.1643 27.1391L59.1125 35.1438H63.6831Z" fill="black"/><path d="M79.6948 40.505H70.8748C69.4913 40.505 68.923 40.0356 68.923 39.0226C68.923 38.7509 68.9725 38.4297 69.0466 38.0591L70.6525 30.4497C70.9983 28.7697 71.7395 28.0038 73.5183 28.0038H82.3383L81.696 31.0426H74.6548C74.1113 31.0426 73.963 31.1662 73.8395 31.7097L72.7772 36.7003C72.7525 36.8238 72.7278 36.9226 72.7278 37.0215C72.7278 37.2932 72.876 37.392 73.296 37.392H80.3372L79.6948 40.505Z" fill="black"/><path d="M92.5911 40.505H83.7711C82.3876 40.505 81.8193 40.0356 81.8193 39.0226C81.8193 38.7509 81.8687 38.4297 81.9429 38.0591L83.5487 30.4497C83.8946 28.7697 84.6358 28.0038 86.4146 28.0038H95.2346L94.5923 31.0426H87.5511C87.0076 31.0426 86.8593 31.1662 86.7358 31.7097L85.6734 36.7003C85.6487 36.8238 85.624 36.9226 85.624 37.0215C85.624 37.2932 85.7723 37.392 86.1923 37.392H93.2334L92.5911 40.505Z" fill="black"/><path d="M106.698 40.505H96.5685C95.1603 40.505 94.5921 40.0356 94.5921 39.0226C94.5921 38.7509 94.6415 38.4297 94.7156 38.0591L96.3215 30.4497C96.6674 28.7697 97.4085 28.0038 99.2121 28.0038H107.661C108.921 28.0038 109.416 28.4732 109.416 29.4368C109.416 29.7085 109.391 30.005 109.317 30.3509L108.279 35.2673H99.9532L100.373 33.192H105.413L105.784 31.512C105.809 31.3885 105.809 31.2897 105.809 31.1909C105.809 30.9438 105.685 30.845 105.29 30.845H100.324C99.7556 30.845 99.6321 30.9932 99.5085 31.5368L98.3474 36.9226C98.3227 37.0709 98.298 37.1944 98.298 37.2932C98.298 37.5897 98.4462 37.6638 98.8662 37.6638H107.291L106.698 40.505Z" fill="black"/><path d="M112.681 40.505H109.222L112.977 22.7662H116.436L112.681 40.505Z" fill="black"/></svg>`;

const esc = (s: string | number) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The app's VLM text marks emphasis with **bold** and !!alert!!; paper drops the markers. */
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/!!(.+?)!!/g, "$1").trim();

type Tone = { fg: string; bg: string };
const TONE = {
  green: { fg: "#15803D", bg: "#ECFDF3" },
  amber: { fg: "#B45309", bg: "#FFF7E6" },
  red: { fg: "#B91C1C", bg: "#FEF2F2" },
  grey: { fg: "#4B4B4B", bg: "#F4F4F6" },
} satisfies Record<string, Tone>;

const STATUS_TONE: Record<string, Tone> = { passed: TONE.green, warning: TONE.amber, failed: TONE.red };
const CONFIDENCE_TONE: Record<string, Tone> = { high: TONE.green, medium: TONE.amber, low: TONE.red };
const VERDICT: Record<AnalysisVerdict, { label: string; tone: Tone }> = {
  pending: { label: "Pending review", tone: TONE.amber },
  approved: { label: "Approved", tone: TONE.green },
  rejected: { label: "Rejected", tone: TONE.red },
};

const pill = (label: string, t: Tone) =>
  `<span class="pill" style="color:${t.fg};background:${t.bg}">${esc(label)}</span>`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* VLM output usually arrives as "Scene: … Timestamped observations: - 00:01 - …
   Rule impact: … Overall: …". Split it into those parts so the reasoning reads
   as a list instead of one wall of text; anything unstructured stays a paragraph. */
const VLM_PARTS = ["Scene", "Timestamped observations", "Rule impact", "Overall"];

function reasoningHtml(raw: string) {
  const text = plain(raw);
  const re = new RegExp(`(${VLM_PARTS.join("|")}):`, "g");
  const marks = [...text.matchAll(re)];
  if (marks.length === 0) return `<p class="vlm-p">${esc(text)}</p>`;

  const out: string[] = [];
  const lead = text.slice(0, marks[0].index).trim();
  if (lead) out.push(`<p class="vlm-p">${esc(lead)}</p>`);
  marks.forEach((m, i) => {
    const body = text.slice((m.index ?? 0) + m[0].length, marks[i + 1]?.index ?? text.length).trim();
    if (!body) return;
    if (m[1] === "Timestamped observations") {
      const items = body.split(/(?:^|\s)-\s(?=\d{1,2}:\d{2})/).map((x) => x.trim()).filter(Boolean);
      const rows = items.map((it) => {
        const t = it.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*/);
        return t
          ? `<li><span class="ts">${esc(t[1])}</span><span>${esc(it.slice(t[0].length))}</span></li>`
          : `<li><span class="ts"></span><span>${esc(it)}</span></li>`;
      });
      out.push(`<p class="vlm-h">Timestamped observations</p><ul class="obs">${rows.join("")}</ul>`);
    } else {
      out.push(`<p class="vlm-h">${esc(m[1])}</p><p class="vlm-p">${esc(body)}</p>`);
    }
  });
  return out.join("");
}

function modelHtml(m: RunReportModel, multi: boolean) {
  const r = m.result;
  const scoreTone = STATUS_TONE[m.status] ?? TONE.grey;
  const failed = m.runState === "failed";
  const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;

  const steps = r.stepResults.length === 0
    ? `<p class="empty">No steps ran for this model.</p>`
    : `<table class="data">
        <thead><tr><th class="num">#</th><th>Step</th><th>Model</th><th class="right">Status</th></tr></thead>
        <tbody>${r.stepResults.map((s, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td class="strong">${esc(s.label)}</td>
            <td class="mono">${esc(s.modelLabel)}</td>
            <td class="right">${pill(cap(s.status), STATUS_TONE[s.status] ?? TONE.grey)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;

  const rules = r.triggeredRules.length === 0
    ? `<p class="empty">No rules were triggered.</p>`
    : `<table class="data">
        <thead><tr><th>Rule</th><th>Detection type</th><th>Confidence</th><th class="right">Count</th></tr></thead>
        <tbody>${r.triggeredRules.map((x) => `
          <tr>
            <td class="strong">${esc(x.ruleName)}</td>
            <td>${esc(x.detectionType)}</td>
            <td>${pill(cap(x.confidence), CONFIDENCE_TONE[x.confidence] ?? TONE.grey)}</td>
            <td class="right mono">${esc(x.count)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;

  return `
  <section class="model">
    ${multi ? `<div class="model-head"><span class="model-name">${esc(m.modelName)}</span>${pill(failed ? "Run failed" : cap(m.status), failed ? TONE.red : scoreTone)}</div>` : ""}
    ${failed && m.failure ? `<div class="notice"><strong>${esc(m.failure.reason)}</strong> <span class="mono">${esc(m.failure.code)}</span>${m.failure.detail ? `<br />${esc(m.failure.detail)}` : ""}</div>` : ""}

    <div class="kpis">
      <div class="kpi">
        <div class="kpi-label">Score</div>
        <div class="kpi-value" style="color:${scoreTone.fg}">${esc(r.score)}%</div>
        <div class="kpi-sub">${esc(cap(m.status))}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Steps passed</div>
        <div class="kpi-value">${r.stepsPassed}<span class="of">/${r.stepsTotal}</span></div>
        <div class="kpi-sub">${pct(r.stepsPassed, r.stepsTotal)} complete</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Rules triggered</div>
        <div class="kpi-value">${r.rulesTriggered}<span class="of">/${r.rulesTotal}</span></div>
        <div class="kpi-sub">${r.rulesTriggered === 0 ? "No violations" : `${r.rulesTriggered} violation${r.rulesTriggered === 1 ? "" : "s"}`}</div>
      </div>
    </div>

    <h2>Step results <span class="count">${r.stepResults.length}</span></h2>
    ${steps}

    <h2>Triggered rules <span class="count">${r.triggeredRules.length}</span></h2>
    ${rules}

    <h2>VLM reasoning</h2>
    <div class="vlm">
      <div class="vlm-tag">AI-generated${r.clipDurationSeconds ? ` · ${esc(r.clipDurationSeconds)}s clip` : ""}</div>
      ${r.vlmReasoning ? reasoningHtml(r.vlmReasoning) : `<p class="empty">No reasoning was returned for this run.</p>`}
    </div>
  </section>`;
}

export function buildRunAnalysisReportHtml(d: RunReportInput) {
  const multi = d.models.length > 1;
  const v = VERDICT[d.verdict];
  const modelNames = d.models.map((m) => m.modelName).join(", ");
  const facts: [string, string][] = [
    ["Model", modelNames],
    ["VLM", d.vlmName],
    ...(d.startedBy ? [["Started by", d.startedBy] as [string, string]] : []),
    ...(d.completedAt ? [["Completed", d.completedAt] as [string, string]] : []),
    ...(d.runtime ? [["Runtime", d.runtime] as [string, string]] : []),
    ["Verdict", d.verdictAt ? `${v.label} · ${d.verdictAt}` : v.label],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(d.name)} — Run Analysis Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: #4B4B4B; background: #FFFFFF;
      font-size: 12px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 760px; margin: 0 auto; }
    .accent { height: 4px; background: #FE5C01; }

    /* Header — wordmark left, document label right */
    .head { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 28px 40px 22px; border-bottom: 1px solid #EEEEF0; }
    .head svg { display: block; }
    .doc { text-align: right; }
    .doc-kind { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #9CA3AF; }
    .doc-ref { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: #111111; margin-top: 3px; }

    /* Hero */
    .hero { padding: 32px 40px 8px; text-align: center; }
    .eyebrow { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #FE5C01; }
    h1 { font-size: 26px; line-height: 34px; font-weight: 500; letter-spacing: -0.6px; color: #1F2937; margin-top: 8px; overflow-wrap: anywhere; }
    .pills { margin-top: 12px; display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 10px; font-weight: 600; line-height: 18px; white-space: nowrap; }

    .body { padding: 24px 40px 8px; }

    /* Detail card — the email's #F4F4F6 key/value card */
    .card { background: #F4F4F6; border-radius: 12px; padding: 18px 22px; }
    .facts { width: 100%; border-collapse: collapse; }
    .facts td { padding: 5px 0; vertical-align: top; font-size: 12px; }
    .facts td.k { width: 110px; color: #6B7280; }
    .facts td.v { color: #111111; font-weight: 500; overflow-wrap: anywhere; }

    /* Model block */
    .model { margin-top: 26px; }
    .model + .model { border-top: 1px solid #EEEEF0; padding-top: 26px; }
    .model-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .model-name { font-size: 15px; font-weight: 600; color: #111111; }
    .notice { background: #FEF2F2; border-radius: 10px; padding: 12px 16px; color: #7F1D1D; font-size: 11.5px; margin-bottom: 14px; }

    .kpis { display: flex; gap: 10px; }
    .kpi { flex: 1 1 0; min-width: 0; background: #F4F4F6; border-radius: 12px; padding: 16px 18px; }
    .kpi-label { font-size: 11px; color: #6B7280; }
    .kpi-value { font-size: 28px; line-height: 36px; font-weight: 600; color: #111111; letter-spacing: -0.5px; margin-top: 2px; }
    .kpi-value .of { font-size: 16px; color: #9CA3AF; font-weight: 500; }
    .kpi-sub { font-size: 11px; color: #6B7280; }

    h2 { font-size: 14px; font-weight: 700; color: #111111; margin: 26px 0 10px; display: flex; align-items: center; gap: 8px; }
    h2 .count { font-size: 10px; font-weight: 600; color: #6B7280; background: #F4F4F6; border-radius: 999px; padding: 0 8px; line-height: 18px; }

    table.data { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; font-size: 11.5px; }
    table.data th { text-align: left; padding: 9px 12px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
      font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6B7280; }
    table.data td { padding: 9px 12px; border-bottom: 1px solid #F1F1F3; vertical-align: middle; color: #4B4B4B; overflow-wrap: anywhere; }
    table.data tr:last-child td { border-bottom: 0; }
    .strong { color: #111111; font-weight: 500; }
    .mono { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; }
    .num { width: 28px; color: #9CA3AF; }
    .right, table.data th.right { text-align: right; }
    .empty { color: #9CA3AF; font-style: italic; }

    /* VLM reasoning */
    .vlm { background: #F4F4F6; border-radius: 12px; padding: 18px 22px; }
    .vlm-tag { display: inline-block; font-size: 10px; font-weight: 600; color: #FE5C01; background: #FFF1E8; border-radius: 999px; padding: 0 9px; line-height: 18px; margin-bottom: 4px; }
    .vlm-h { font-size: 11px; font-weight: 700; color: #111111; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 12px; }
    .vlm-p { font-size: 12px; color: #4B4B4B; margin-top: 4px; }
    ul.obs { list-style: none; margin-top: 6px; }
    ul.obs li { display: flex; gap: 12px; padding: 6px 0; border-top: 1px solid #E7E7EA; font-size: 12px; }
    ul.obs li:first-child { border-top: 0; }
    .ts { flex: 0 0 44px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 600; color: #FE5C01; padding-top: 1px; }

    /* Footer band — matches the email footer */
    .foot { margin-top: 32px; background: #F6F5F4; padding: 22px 40px 26px; font-size: 10.5px; line-height: 16px; color: #4B4B4B; }
    .foot .row { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .foot a { color: #FE5C01; text-decoration: none; font-weight: 500; }
    .foot .muted { color: #9CA3AF; margin-top: 6px; }

    h2, .kpis, .vlm-h, ul.obs li, .model-head { break-inside: avoid; }
    h2, .vlm-h { break-after: avoid; }
    tr { break-inside: avoid; }
    @media print { @page { size: A4; margin: 1.2cm 0; } .page { max-width: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="accent"></div>
    <div class="head">
      ${LOGO}
      <div class="doc">
        <div class="doc-kind">Run Analysis Report</div>
        ${d.runId ? `<div class="doc-ref">${esc(d.runId)}</div>` : ""}
      </div>
    </div>

    <div class="hero">
      <div class="eyebrow">Analysis result</div>
      <h1>${esc(d.name)}</h1>
      <div class="pills">
        ${pill(v.label, v.tone)}
        ${multi ? pill(`${d.models.length} models`, TONE.grey) : ""}
      </div>
    </div>

    <div class="body">
      <div class="card">
        <table class="facts" role="presentation">
          ${facts.map(([k, val]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(val)}</td></tr>`).join("")}
        </table>
      </div>

      ${d.models.map((m) => modelHtml(m, multi)).join("")}
    </div>

    <div class="foot">
      <div class="row">
        <span>Exported ${esc(d.exportedAt)} from Accel Run Analysis</span>
        <span><a href="https://accel.com/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="https://accel.com/terms">Terms &amp; Conditions</a></span>
      </div>
      <div class="muted">&copy; 2026 Sigmawave AI. All Rights Reserved. Confidential — for internal review only.</div>
    </div>
  </div>
</body>
</html>`;
}

/** Opens the report in a new tab and hands it to the print dialog ("Save as PDF"). */
export function exportRunAnalysisPdf(d: RunReportInput) {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Export blocked", { description: "Allow pop-ups for this page to export the PDF." });
    return;
  }
  const printScript = `<script>window.onload=function(){setTimeout(function(){window.print();},300);window.onafterprint=function(){window.close();};};</script>`;
  w.document.write(buildRunAnalysisReportHtml(d).replace("</body>", `${printScript}</body>`));
  w.document.close();
}
