import type { Meta, StoryObj } from "@storybook/react-vite";
import { Keyboard, Megaphone, PencilLine } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

/**
 * Keyboard and screen-reader behaviour of each interactive component, and what
 * the caller still has to provide. Behaviour marked "tested" is covered by
 * packages/ui/test; every story and page also passes axe in light and dark
 * (npm run test:a11y, npm run test:a11y:pages).
 */
const meta: Meta = {
  title: "Guidelines/Accessibility",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

interface Row {
  component: string;
  keyboard: string;
  screenReader: string;
  youProvide: string;
}

const ROWS: Row[] = [
  {
    component: "Button",
    keyboard: "Tab to focus; Enter / Space activates. Visible focus ring.",
    screenReader: "Announced as a button with its text.",
    youProvide: "Icon-only buttons (size icon*) need aria-label naming the action and its object, e.g. “Actions for Loading Bay 3”.",
  },
  {
    component: "DataTable",
    keyboard: "Clickable rows are focusable; Enter / Space opens the row (tested). Controls in stopRowClick cells keep their own keys.",
    screenReader: "Real table semantics. Selected rows carry data-state, checkboxes are named (tested).",
    youProvide: "selection.getRowLabel / selectAllLabel for meaningful checkbox names; sr-only header text for icon-only columns.",
  },
  {
    component: "Modal · ConfirmDialog",
    keyboard: "Focus moves inside, Tab is trapped, Esc closes, focus returns to the opener (tested).",
    screenReader: "Dialog named by ModalHeader title; description read via aria-describedby.",
    youProvide: "A title that says what the dialog does. One primary action in the footer.",
  },
  {
    component: "DetailDrawer · Sheet",
    keyboard: "Same as Modal: trapped focus, Esc and the built-in Close button close it, focus returns to the row or button that opened it (tested).",
    screenReader: "Dialog named by DetailDrawerTitle; sections are named regions (tested).",
    youProvide: "DetailDrawerTitle (required) and DetailDrawerDescription for the ID / site line.",
  },
  {
    component: "SegmentedControl",
    keyboard: "Single: arrow keys move between items (roving focus), Space / Enter selects (tested).",
    screenReader: "Single → radio group with checked state; multiple → toggle buttons with aria-pressed (tested).",
    youProvide: "aria-label on the control (“View”, “Sites”). Guard the empty value in onValueChange for single.",
  },
  {
    component: "Tabs",
    keyboard: "Arrow keys switch tabs; Tab moves into the panel.",
    screenReader: "tablist / tab / tabpanel with selected state.",
    youProvide: "Use Tabs only when each option swaps a panel; otherwise SegmentedControl.",
  },
  {
    component: "FilterDropdown · FilterPanel",
    keyboard: "Trigger opens the popover; Tab through options; Esc closes.",
    screenReader: "Options announce on/off with aria-pressed; the trigger reads the current selection (“2 selected”) (tested).",
    youProvide: "A label that names the dimension (“All sites”).",
  },
  {
    component: "DateRangeBar",
    keyboard: "Presets are buttons; Custom opens a popover with From / To date fields and Apply / Reset.",
    screenReader: "Active preset has aria-pressed; From / To are labelled fields (tested).",
    youProvide: "Nothing extra.",
  },
  {
    component: "Select · ChoiceDropdown · ModalSelect",
    keyboard: "Space / Enter / arrows open; arrows move; type-ahead; Esc closes.",
    screenReader: "Combobox with its value; inside ModalField the label is linked (tested).",
    youProvide: "aria-label when there is no visible linked label.",
  },
  {
    component: "TimeSelect",
    keyboard: "Trigger opens hour / minute / AM-PM columns; OK commits, Cancel discards (tested).",
    screenReader: "Each column is a labelled listbox with aria-selected options (tested).",
    youProvide: "aria-label naming the time (“Opening time”).",
  },
  {
    component: "Slider",
    keyboard: "Arrow keys step, Page Up/Down jump, Home / End to limits.",
    screenReader: "aria-label is applied to each thumb; ranges announce “… minimum / maximum” (tested).",
    youProvide: "aria-label on Slider, or thumbLabels for custom thumb names.",
  },
  {
    component: "Checkbox · Switch",
    keyboard: "Space toggles.",
    screenReader: "Checkbox / switch with state.",
    youProvide: "A label: a linked <Label htmlFor> or aria-label.",
  },
  {
    component: "ToolbarSearch",
    keyboard: "Standard text field.",
    screenReader: "Named by its placeholder unless you pass aria-label (tested).",
    youProvide: "A placeholder or aria-label that says what is searched.",
  },
  {
    component: "KpiCard",
    keyboard: "With onClick it is a button (Tab, Enter / Space).",
    screenReader: "Clickable cards announce on/off with aria-pressed (active).",
    youProvide: "A label that reads well on its own (“Offline cameras”).",
  },
  {
    component: "Stepper",
    keyboard: "Not interactive — navigation stays with Back / Next.",
    screenReader: "Ordered list; current step has aria-current=\"step\"; done / current spelled out (tested).",
    youProvide: "aria-label for the list (“Sign-up progress”).",
  },
  {
    component: "StatusBadge",
    keyboard: "Not interactive.",
    screenReader: "Reads its text; colour is never the only signal.",
    youProvide: "Always a text label, never a colour dot alone.",
  },
  {
    component: "Tooltip",
    keyboard: "Shows on focus as well as hover; Esc dismisses.",
    screenReader: "Read as the trigger’s description.",
    youProvide: "Never put essential information only in a tooltip. Needs a TooltipProvider above it (AppLayout has one).",
  },
  {
    component: "PageHeader · SectionCard",
    keyboard: "—",
    screenReader: "PageHeaderTitle is the page h1; SectionCard titles are h3 by default.",
    youProvide: "One h1 per page; headingLevel={2} on SectionCards placed directly under the page title.",
  },
  {
    component: "Charts (Area, Bar, Line)",
    keyboard: "accessibilityLayer: focus the chart and use arrow keys to move between points.",
    screenReader: "Tooltip values are announced as you move.",
    youProvide: "A text summary or table next to any chart a decision depends on.",
  },
];

function Page() {
  return (
    <div data-slot="a11y-notes" className="max-w-6xl space-y-4 text-base text-foreground">
      <header data-slot="a11y-notes-header" className="space-y-1">
        <h1 className="text-3xl font-bold">Accessibility</h1>
        <p className="text-muted-foreground">
          What each component handles for you, and what you still have to provide. “Tested” means an interaction test in{" "}
          <code className="font-mono text-sm">packages/ui/test</code> covers it. Every story and every page also passes axe
          in light and dark (<code className="font-mono text-sm">npm run test:a11y</code>,{" "}
          <code className="font-mono text-sm">npm run test:a11y:pages</code>).
        </p>
      </header>
      <div data-slot="a11y-notes-table" className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Component</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5">
                  <Keyboard className="size-4" aria-hidden /> Keyboard
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5">
                  <Megaphone className="size-4" aria-hidden /> Screen reader
                </span>
              </TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5">
                  <PencilLine className="size-4" aria-hidden /> You provide
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow key={r.component} className="align-top">
                <TableCell className="whitespace-normal font-semibold">{r.component}</TableCell>
                <TableCell className="whitespace-normal text-sm">{r.keyboard}</TableCell>
                <TableCell className="whitespace-normal text-sm">{r.screenReader}</TableCell>
                <TableCell className="whitespace-normal text-sm">{r.youProvide}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const ComponentNotes: Story = {
  name: "Component notes",
  render: () => <Page />,
};
