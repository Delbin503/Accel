import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CheckList,
  CheckListEmpty,
  CheckListSelectAll,
  CheckRow,
  MODAL_NOTE,
  ModalField,
  ModalFieldPair,
  ModalFormSection,
  ModalPasswordInput,
  ModalSearchInput,
  ModalSelect,
  ModalTextInput,
  OptionChips,
} from "./ModalForm";
import { StatusBadge } from "./StatusBadge";

/**
 * Building blocks for long form modals (Add Camera, Add NVR). Shown here
 * outside a Modal so each part can be inspected; in the app they sit in
 * `ModalBody`.
 */
const meta: Meta<typeof ModalFormSection> = {
  title: "Shared/ModalForm",
  component: ModalFormSection,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[34rem] space-y-6 rounded-xl border border-border bg-card p-5"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ModalFormSection>;

const SITES = [
  { value: "changi", label: "Changi Logistics Hub" },
  { value: "jurong", label: "Jurong Warehouse 2" },
  { value: "tuas", label: "Tuas Depot" },
];

/** A full Add Camera form: note, sections, paired fields, chips. */
export const Default: Story = {
  render: function DefaultStory() {
    const [name, setName] = React.useState("Loading Bay North");
    const [site, setSite] = React.useState("changi");
    const [ip, setIp] = React.useState("10.20.4.14");
    const [port, setPort] = React.useState("554");
    const [user, setUser] = React.useState("admin");
    const [pw, setPw] = React.useState("");
    const [fps, setFps] = React.useState(15);
    return (
      <>
        <p className={MODAL_NOTE}>
          Adding a camera to <strong>Changi Logistics Hub</strong>. It starts streaming once the connection test passes.
        </p>
        <ModalFormSection title="Camera">
          <ModalFieldPair>
            <ModalField label="Camera name">
              <ModalTextInput value={name} onChange={setName} placeholder="e.g. Gate 3 Entrance" />
            </ModalField>
            <ModalField label="Site">
              <ModalSelect value={site} onChange={setSite} placeholder="Select site" options={SITES} ariaLabel="Site" />
            </ModalField>
          </ModalFieldPair>
        </ModalFormSection>
        <ModalFormSection title="Connection">
          <ModalFieldPair>
            <ModalField label="IP address" hint="IPv4 on the site VLAN">
              <ModalTextInput value={ip} onChange={setIp} mono />
            </ModalField>
            <ModalField label="RTSP port">
              <ModalTextInput value={port} onChange={setPort} mono />
            </ModalField>
            <ModalField label="Username">
              <ModalTextInput value={user} onChange={setUser} />
            </ModalField>
            <ModalField label="Password">
              <ModalPasswordInput value={pw} onChange={setPw} />
            </ModalField>
          </ModalFieldPair>
        </ModalFormSection>
        <ModalFormSection title="Frame rate">
          <OptionChips
            value={fps}
            onChange={setFps}
            options={[5, 10, 15, 25, 30].map((v) => ({ value: v, label: `${v} fps` }))}
          />
        </ModalFormSection>
      </>
    );
  },
};

/** Validation errors and invalid controls. */
export const Errors: Story = {
  render: () => (
    <ModalFormSection title="Connection">
      <ModalFieldPair>
        <ModalField label="IP address" error="Enter a valid IPv4 address.">
          <ModalTextInput value="10.20.4" onChange={() => {}} mono invalid />
        </ModalField>
        <ModalField label="Site" error="Choose a site.">
          <ModalSelect value="" onChange={() => {}} placeholder="Select site" options={SITES} invalid ariaLabel="Site" />
        </ModalField>
        <ModalField label="Password" error="Password is required.">
          <ModalPasswordInput value="" onChange={() => {}} invalid />
        </ModalField>
      </ModalFieldPair>
    </ModalFormSection>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ModalFormSection title="Managed by NVR">
      <ModalFieldPair>
        <ModalField label="IP address" hint="Inherited from NVR-02">
          <ModalTextInput value="10.20.4.2" onChange={() => {}} mono disabled />
        </ModalField>
        <ModalField label="Site">
          <ModalSelect value="jurong" onChange={() => {}} placeholder="Select site" options={SITES} disabled ariaLabel="Site" />
        </ModalField>
      </ModalFieldPair>
    </ModalFormSection>
  ),
};

/** Multi-select chips (`multi`). */
export const MultiChips: Story = {
  render: function MultiStory() {
    const [days, setDays] = React.useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
    return (
      <ModalFormSection title="Active days">
        <OptionChips
          multi
          value={days}
          onChange={(d) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))}
          options={["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))}
        />
      </ModalFormSection>
    );
  },
};

const CAMERAS = [
  { id: "CAM-014", name: "Loading Bay North", ip: "10.20.4.14", online: true },
  { id: "CAM-022", name: "Gate 3 Entrance", ip: "10.20.4.22", online: true },
  { id: "CAM-031", name: "Perimeter Fence East", ip: "10.20.4.31", online: false },
];

/** Searchable checklist with Select all, a disabled row and a status aside. */
export const Checklist: Story = {
  // Known exception: the "already deployed" rows are disabled (opacity-60);
  // WCAG 1.4.3 exempts inactive controls, which axe can't tell apart.
  parameters: { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } },
  render: function ChecklistStory() {
    const [query, setQuery] = React.useState("");
    const [picked, setPicked] = React.useState<string[]>(["CAM-014"]);
    const selectable = CAMERAS.filter((c) => c.online);
    const shown = CAMERAS.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(query.toLowerCase()));
    const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    return (
      <ModalFormSection title="Cameras to deploy">
        <ModalSearchInput value={query} onChange={setQuery} placeholder="Search cameras" />
        <CheckList
          head={
            <CheckListSelectAll
              checked={picked.length === selectable.length}
              onToggle={() => setPicked(picked.length === selectable.length ? [] : selectable.map((c) => c.id))}
              count={`${picked.length} of ${selectable.length}`}
            />
          }
          empty={shown.length === 0 ? <CheckListEmpty>No cameras match “{query}”.</CheckListEmpty> : undefined}
        >
          {shown.map((c) => (
            <CheckRow
              key={c.id}
              label={`${c.id} ${c.name}`}
              checked={picked.includes(c.id)}
              disabled={!c.online}
              onToggle={() => toggle(c.id)}
              title={`${c.id} · ${c.name}`}
              meta={c.ip}
              aside={<StatusBadge tone={c.online ? "success" : "neutral"}>{c.online ? "Online" : "Offline"}</StatusBadge>}
            />
          ))}
        </CheckList>
      </ModalFormSection>
    );
  },
};

/** Empty checklist. */
export const ChecklistEmpty: Story = {
  render: () => (
    <ModalFormSection title="Cameras to deploy">
      <CheckList empty={<CheckListEmpty>This site has no cameras yet.</CheckListEmpty>}>{null}</CheckList>
    </ModalFormSection>
  ),
};
