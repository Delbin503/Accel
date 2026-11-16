import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, Building2, Cctv, FileText, Film, Plus, Video } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Command> = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Command>;

function PaletteBody() {
  return (
    <>
      <CommandInput placeholder="Search cameras, sites, detections…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Cameras">
          <CommandItem>
            <Cctv /> CAM-014 · Loading Bay North
          </CommandItem>
          <CommandItem>
            <Cctv /> CAM-022 · Gate 3 Entrance
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Sites">
          <CommandItem>
            <Building2 /> Changi Logistics Hub
          </CommandItem>
          <CommandItem>
            <Building2 /> Jurong Warehouse 2
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <Plus /> Add camera
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Video /> Open live monitoring
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <FileText /> Export audit log (admin only)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
}

/** Inline command list — the palette body without the dialog shell. */
export const Default: Story = {
  render: () => (
    <Command className="w-[28rem] border border-border">
      <PaletteBody />
    </Command>
  ),
};

/** Typing a query that matches nothing shows `CommandEmpty`. */
export const Empty: Story = {
  // Known exception: cmdk keeps role="listbox" with no options while showing
  // "No results"; screen readers announce the empty message fine.
  parameters: { a11y: { config: { rules: [{ id: "aria-required-children", enabled: false }] } } },
  render: () => (
    <Command className="w-[28rem] border border-border">
      <CommandInput placeholder="Search…" value="forklift zone 9" readOnly />
      <CommandList>
        <CommandEmpty>No cameras, sites or detections match “forklift zone 9”.</CommandEmpty>
        <CommandGroup heading="Cameras">
          <CommandItem>
            <Cctv /> CAM-014 · Loading Bay North
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/** Caller-owned filtering while results load (`shouldFilter={false}`). */
export const Loading: Story = {
  render: () => (
    <Command shouldFilter={false} className="w-[28rem] border border-border">
      <CommandInput placeholder="Search detections…" />
      <CommandList>
        <CommandGroup heading="Detections">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/** Disabled items stay visible but can't be selected. */
export const DisabledItems: Story = {
  render: () => (
    <Command className="w-[28rem] border border-border">
      <CommandList>
        <CommandGroup heading="Recordings">
          <CommandItem>
            <Film /> CAM-014 · Today 09:00–10:00
          </CommandItem>
          <CommandItem disabled>
            <Film /> CAM-031 · Offline — no footage
          </CommandItem>
          <CommandItem disabled>
            <AlertTriangle /> Archived detections (retention expired)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/** The ⌘K dialog shell. */
export const Dialog: Story = {
  render: function DialogStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open command palette
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <PaletteBody />
        </CommandDialog>
      </>
    );
  },
};
