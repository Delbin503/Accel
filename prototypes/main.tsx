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
      { name: "Model Deployment", slug: "PRD_Model_Deployment" },
    ],
  },
  {
    phase: "Phase 1",
    priority: "P1",
    modules: [
      { name: "Detection Feed", slug: "PRD_Detection_Feed" },
      { name: "Rules Library", slug: "PRD_Rule_Library" },
      { name: "Incident Cases", slug: "PRD_Incident_Cases" },
    ],
  },
  {
    phase: "Phase 2",
    priority: "P0",
    modules: [
      { name: "Run Analysis", slug: "PRD_Run_Analysis" },
      { name: "System Configuration", slug: "PRD_System_Configuration" },
      { name: "Site · NVR Devices", slug: "PRD_NVR_Devices" },
      { name: "Recordings", slug: "PRD_Recordings" },
      { name: "Activity Logs", slug: "PRD_Activity_Logs" },
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
      { name: "Profile Settings", slug: "PRD_Profile_Settings" },
      { name: "Dashboard", slug: "PRD_Dashboard" },
      { name: "Site · Overview", slug: "PRD_Site_Management" },
      { name: "Device Health", slug: "PRD_Device_Health" },
      { name: "Billing / Subscription", slug: "PRD_Billing" },
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
/* Phase 1.3 and Accel TRMS have tabs of their own, so they're not "unmapped". */
const OWN_TAB = new Set(["PRD_Phase_1_3", "PRD_Accel_TRMS"]);
const unmapped = [...discovered].filter((s) => !mapped.has(s) && !OWN_TAB.has(s)).sort();

/* Phase 1.3 pages — each card opens the prototype straight on its page (?p=). */
const PHASE_13 = "PRD_Phase_1_3";
const PHASE_13_PAGES: { name: string; desc: string; path: string }[] = [
  { name: "Customizable Dashboard", desc: "Dashboard, rebuilt", path: "/dashboard" },
  { name: "System Configuration", desc: "Camera Defaults › Recording Schedule", path: "/config" },
  { name: "Synchronised Playback", desc: "Live Monitoring, rebuilt", path: "/live" },
  { name: "Recordings", desc: "Recordings, rebuilt", path: "/recordings" },
  { name: "Video Enhancement", desc: "Recordings › playback", path: "/enhancement" },
];
const REID_MODULE = {
  name: "Model (Re-ID) Module",
  desc: "Live Monitoring · Detection Feed · Model Management · Model Deployment",
  path: "/reid/live",
};

type TabKey = "phase-1" | "phase-1-3" | "trms";
const TABS: { key: TabKey; label: string }[] = [
  { key: "phase-1", label: "Phase 1" },
  { key: "phase-1-3", label: "Phase 1.3" },
  { key: "trms", label: "Accel TRMS" },
];
const tabFromHash = (): TabKey => {
  const h = window.location.hash.slice(1);
  return TABS.some((t) => t.key === h) ? (h as TabKey) : "phase-1";
};

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

function LinkCard({ name, desc, href }: { name: string; desc?: string; href: string | null }) {
  if (!href) {
    return (
      <div className="card soon">
        <div className="name">{name}</div>
        {desc && <div className="desc">{desc}</div>}
        <div className="meta">
          <span className="tag">No design yet</span>
        </div>
      </div>
    );
  }
  return (
    <a className="card ready" href={href}>
      <div className="name">{name}</div>
      {desc && <div className="desc">{desc}</div>}
      <div className="meta">
        <span className="open">Open →</span>
      </div>
    </a>
  );
}

function Section({ title, badge, count, children }: { title: string; badge?: "P0" | "P1"; count?: string; children: React.ReactNode }) {
  return (
    <section className="phase">
      <div className="phase-head">
        <span className="phase-title">{title}</span>
        {badge && <span className={`badge ${badge.toLowerCase()}`}>{badge}</span>}
        {count && <span className="count">{count}</span>}
      </div>
      <div className="rule" />
      <div className="grid">{children}</div>
    </section>
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
  const [tab, setTab] = React.useState<TabKey>(tabFromHash);
  React.useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const phase13Ready = has(PHASE_13);
  const counts: Record<TabKey, number> = {
    "phase-1": PHASES.reduce((n, p) => n + p.modules.length, 0) + unmapped.length,
    "phase-1-3": PHASE_13_PAGES.length + 1,
    trms: 1,
  };

  return (
    <div>
      <nav className="tabs" role="tablist" aria-label="Prototype groups">
        {TABS.map((t) => (
          <a
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`tab${tab === t.key ? " on" : ""}`}
            href={`#${t.key}`}
          >
            {t.label}
            <span className="tab-count">{counts[t.key]}</span>
          </a>
        ))}
      </nav>

      {tab === "phase-1" && (
        <>
          {PHASES.map((p) => (
            <PhaseSection key={`${p.phase}-${p.priority}`} p={p} />
          ))}
          {unmapped.length > 0 && (
            <Section title="Other prototypes" count={`${unmapped.length} not yet on the roadmap`}>
              {unmapped.map((slug) => (
                <LinkCard key={slug} name={slug} href={`/${slug}/`} />
              ))}
            </Section>
          )}
          <footer className="note">
            Phases reflect P0 / P1 delivery priority. Grey modules are not yet prototyped.
          </footer>
        </>
      )}

      {tab === "phase-1-3" && (
        <>
          <Section title="Phase 1.3" badge="P1" count={`${PHASE_13_PAGES.length} pages`}>
            {PHASE_13_PAGES.map((pg) => (
              <LinkCard key={pg.path} name={pg.name} desc={pg.desc} href={phase13Ready ? `/${PHASE_13}/?p=${pg.path}` : null} />
            ))}
          </Section>
          <Section title="Separate module" count="Opens with its own navigation">
            <LinkCard name={REID_MODULE.name} desc={REID_MODULE.desc} href={phase13Ready ? `/${PHASE_13}/?p=${REID_MODULE.path}` : null} />
          </Section>
        </>
      )}

      {tab === "trms" && (
        <Section title="Accel TRMS" count="1 prototype">
          <LinkCard name="Accel TRMS" desc="The TRMS prototype" href={has("PRD_Accel_TRMS") ? "/PRD_Accel_TRMS/" : null} />
        </Section>
      )}
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<PrototypeIndex />);
