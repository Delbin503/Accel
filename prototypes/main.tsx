import React from "react";
import { createRoot } from "react-dom/client";

/* Auto-discovered prototype slugs (folders with an index.tsx). */
const modules = import.meta.glob("./**/index.tsx");
const discovered = new Set(
  Object.keys(modules)
    .map((path) => path.replace(/^\.\//, "").replace(/\/index\.tsx$/, ""))
    .filter(Boolean)
);

type Variant = { label: string; slug: string };
type ModuleDef = { name: string; slug?: string; variants?: Variant[] };
type Phase = { phase: string; priority: "P0" | "P1"; modules: ModuleDef[] };

/* Platform modules grouped by delivery phase + priority (from the roadmap). */
const PHASES: Phase[] = [
  {
    phase: "Phase 1",
    priority: "P0",
    modules: [
      { name: "User Management", slug: "PRD_User_Management" },
      { name: "Site · Cameras", slug: "PRD_Cameras" },
      { name: "Live Monitoring", slug: "PRD_Live_Monitoring" },
      { name: "Model Management", slug: "PRD_Model_Management" },
      { name: "Model Deployment" },
    ],
  },
  {
    phase: "Phase 1",
    priority: "P1",
    modules: [
      { name: "Detection Feed", slug: "PRD_Detection_Feed" },
      { name: "Rules Library", slug: "PRD_Rule_Library" },
      { name: "Incident Cases" },
    ],
  },
  {
    phase: "Phase 2",
    priority: "P0",
    modules: [
      { name: "Run Analysis" },
      { name: "System Configuration" },
      { name: "Site · NVR Devices", slug: "PRD_NVR_Devices" },
      { name: "Recordings", slug: "PRD_Recordings" },
      { name: "Activity Logs" },
    ],
  },
  {
    phase: "Phase 2",
    priority: "P1",
    modules: [
      {
        name: "Onboarding · Login / Registration",
        variants: [
          { label: "Cloud", slug: "PRD_Onboarding_Cloud" },
          { label: "On-Premise", slug: "PRD_Onboarding_OnPremise" },
          { label: "Invite Signup", slug: "PRD_Invite_Signup" },
        ],
      },
      { name: "Profile Settings" },
      { name: "Dashboard", slug: "PRD_Dashboard" },
      { name: "Site · Overview", slug: "PRD_Site_Management" },
      { name: "Device Health" },
      { name: "Billing / Subscription" },
    ],
  },
];

function has(slug?: string) {
  return !!slug && discovered.has(slug);
}

/* Slugs referenced anywhere in the roadmap above. */
const mapped = new Set<string>();
PHASES.forEach((p) =>
  p.modules.forEach((m) => {
    if (m.slug) mapped.add(m.slug);
    m.variants?.forEach((v) => mapped.add(v.slug));
  })
);
const unmapped = [...discovered].filter((s) => !mapped.has(s)).sort();

function ModuleCard({ mod }: { mod: ModuleDef }) {
  // Module backed by several prototype variants.
  if (mod.variants) {
    return (
      <div className="card">
        <div className="name">{mod.name}</div>
        <div className="variants">
          {mod.variants.map((v) =>
            has(v.slug) ? (
              <a key={v.slug} className="chip" href={`/${v.slug}/`}>
                {v.label} →
              </a>
            ) : (
              <span key={v.slug} className="chip soon">
                {v.label}
              </span>
            )
          )}
        </div>
      </div>
    );
  }

  // Single-prototype module → the whole card is the link when ready.
  if (has(mod.slug)) {
    return (
      <a className="card ready" href={`/${mod.slug}/`}>
        <div className="name">{mod.name}</div>
        <div className="meta">
          <span className="open">Open →</span>
        </div>
      </a>
    );
  }

  // No design PRD yet → greyed, not clickable.
  return (
    <div className="card soon">
      <div className="name">{mod.name}</div>
      <div className="meta">
        <span className="tag">No design yet</span>
      </div>
    </div>
  );
}

function PhaseSection({ p }: { p: Phase }) {
  const ready = p.modules.filter(
    (m) => has(m.slug) || m.variants?.some((v) => has(v.slug))
  ).length;
  return (
    <section className="phase">
      <div className="phase-head">
        <span className="phase-title">{p.phase}</span>
        <span className={`badge ${p.priority.toLowerCase()}`}>{p.priority}</span>
        <span className="count">
          {ready}/{p.modules.length} prototyped
        </span>
      </div>
      <div className="rule" />
      <div className="grid">
        {p.modules.map((m) => (
          <ModuleCard key={m.name} mod={m} />
        ))}
      </div>
    </section>
  );
}

function PrototypeIndex() {
  return (
    <div>
      {PHASES.map((p) => (
        <PhaseSection key={`${p.phase}-${p.priority}`} p={p} />
      ))}

      {unmapped.length > 0 && (
        <section className="phase">
          <div className="phase-head">
            <span className="phase-title">Other prototypes</span>
            <span className="count">{unmapped.length} not yet on the roadmap</span>
          </div>
          <div className="rule" />
          <div className="grid">
            {unmapped.map((slug) => (
              <a key={slug} className="card ready" href={`/${slug}/`}>
                <div className="name">{slug}</div>
                <div className="meta">
                  <span className="open">Open →</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="note">
        Phases reflect P0 / P1 delivery priority. Grey modules are not yet prototyped.
      </footer>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<PrototypeIndex />);
