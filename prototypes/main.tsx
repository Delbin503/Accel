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
/* All delivered platform modules, reviewed together as one app: the index shows a
   single "Phase 1 dashboard" card, and each module links on to the others through
   the sidebar and in-page links (see _shared/protoRoutes.ts). Listed here so their
   folders are not reported as unmapped. */
const PHASE_ONE_MODULES: ModuleDef[] = [
  { name: "Dashboard", slug: "PRD_Dashboard" },
  { name: "User Management", slug: "PRD_User_Management" },
  { name: "Profile Settings", slug: "PRD_Profile_Settings" },
  { name: "Site · Overview", slug: "PRD_Site_Management" },
  { name: "Site · Cameras", slug: "PRD_Cameras" },
  { name: "Site · NVR Devices", slug: "PRD_NVR_Devices" },
  { name: "Live Monitoring", slug: "PRD_Live_Monitoring" },
  { name: "Detection Feed", slug: "PRD_Detection_Feed" },
  { name: "Incident Cases", slug: "PRD_Incident_Cases" },
  { name: "Rules Library", slug: "PRD_Rule_Library" },
  { name: "Recordings", slug: "PRD_Recordings" },
  { name: "Model Management", slug: "PRD_Model_Management" },
  { name: "Model Deployment", slug: "PRD_Model_Deployment" },
  { name: "Run Analysis", slug: "PRD_Run_Analysis" },
  { name: "Device Health", slug: "PRD_Device_Health" },
  { name: "System Configuration", slug: "PRD_System_Configuration" },
  { name: "Activity Logs", slug: "PRD_Activity_Logs" },
  { name: "Billing / Subscription", slug: "PRD_Billing" },
];

const STANDALONE_PROTOTYPES: ModuleDef[] = [
  {
    name: "Onboarding",
    variants: [
      { label: "Cloud", slug: "PRD_Onboarding_Cloud" },
      { label: "On-Premise", slug: "PRD_Onboarding_OnPremise" },
      { label: "Invite Signup", slug: "PRD_Invite_Signup" },
    ],
  },
  { name: "Email Templates", slug: "PRD_Email_Templates" },
  { name: "Interactive Demo", slug: "PRD_Interactive_Demo" },
  { name: "Quick Actions", slug: "PRD_Quick_Actions" },
];

/* Phase 2: the training-assessment lo-fi plus the Phase 1.3 prototype's
   Training Assessment module and AAR page. */
const TA_LOFI: ModuleDef = { name: "Training Assessment (lo-fi)", slug: "PRD_Training_Assessment" };

function has(slug?: string) {
  return !!slug && discovered.has(slug);
}

/* Slugs referenced by the Phase 1 slide or its standalone prototypes. */
const mapped = new Set<string>();
[
  ...PHASE_ONE_MODULES,
  ...STANDALONE_PROTOTYPES,
  TA_LOFI,
].forEach((m) => {
    if (m.slug) mapped.add(m.slug);
    m.variants?.forEach((v) => mapped.add(v.slug));
  });
/* Phase 1.3 has a tab of its own, so it's not "unmapped". */
const OWN_TAB = new Set(["PRD_Phase_1_3"]);
const unmapped = [...discovered].filter((s) => !mapped.has(s) && !OWN_TAB.has(s)).sort();

/* Phase 1.3 pages — each card opens the prototype straight on its page (?p=).
   Customizable Dashboard, System Configuration (Recording Schedule),
   Synchronised Playback, Recordings and Video Enhancement were merged into
   Phase 1 — they open from the Phase 1 dashboard's sidebar now. */
const PHASE_13 = "PRD_Phase_1_3";
const AAR_PAGE = { name: "AAR", desc: "After Action Review · indoor range", path: "/aar" };
const REID_MODULE = {
  name: "Model (Re-ID) Module",
  desc: "Live Monitoring · Detection Feed · Model Management · Model Deployment",
  path: "/reid/live",
};
const TA_MODULE = {
  name: "Training Assessment Module",
  desc: "Dashboard · Model Management · Camera Defaults · External Devices · Model Deployment · Performance & Posture",
  path: "/assessment/dashboard",
};

type TabKey = "phase-1" | "phase-1-3" | "phase-2";
const TABS: { key: TabKey; label: string }[] = [
  { key: "phase-1", label: "Phase 1" },
  { key: "phase-1-3", label: "Phase 1.3" },
  { key: "phase-2", label: "Phase 2" },
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

function PrototypeIndex() {
  const [tab, setTab] = React.useState<TabKey>(tabFromHash);
  React.useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const phase13Ready = has(PHASE_13);
  const counts: Record<TabKey, number> = {
    "phase-1": 1 + STANDALONE_PROTOTYPES.length + unmapped.length,
    "phase-1-3": 1,
    "phase-2": 3,
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
          <Section title="Phase 1" badge="P0" count={`${PHASE_ONE_MODULES.length} modules, linked`}>
            <LinkCard
              name="Phase 1 dashboard"
              desc={`All ${PHASE_ONE_MODULES.length} modules in one app — move between them from the sidebar`}
              href={has("PRD_Dashboard") ? "/PRD_Dashboard/" : null}
            />
          </Section>
          <Section title="Standalone prototypes" count={`${STANDALONE_PROTOTYPES.length} separate reviews`}>
            {STANDALONE_PROTOTYPES.map((mod) => (
              <ModuleCard key={mod.name} mod={mod} />
            ))}
          </Section>
          {unmapped.length > 0 && (
            <Section title="Other prototypes" count={`${unmapped.length} not yet on the roadmap`}>
              {unmapped.map((slug) => (
                <LinkCard key={slug} name={slug} href={`/${slug}/`} />
              ))}
            </Section>
          )}
          <footer className="note">
            Phase 1 opens on the dashboard; every delivered module is reachable from there. Grey modules are not yet prototyped.
          </footer>
        </>
      )}

      {tab === "phase-1-3" && (
        <Section title="Phase 1.3" badge="P1" count="Opens with its own navigation">
          <LinkCard name={REID_MODULE.name} desc={REID_MODULE.desc} href={phase13Ready ? `/${PHASE_13}/?p=${REID_MODULE.path}` : null} />
        </Section>
      )}

      {tab === "phase-2" && (
        <Section title="Phase 2" count="3 prototypes">
          <LinkCard name={TA_MODULE.name} desc={TA_MODULE.desc} href={phase13Ready ? `/${PHASE_13}/?p=${TA_MODULE.path}` : null} />
          <LinkCard name={AAR_PAGE.name} desc={AAR_PAGE.desc} href={phase13Ready ? `/${PHASE_13}/?p=${AAR_PAGE.path}` : null} />
          <ModuleCard mod={TA_LOFI} />
        </Section>
      )}
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<PrototypeIndex />);
