import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl, SegmentedControlItem } from "../src/components/ui/segmented-control";
import { TimeSelect } from "../src/components/shared/TimeSelect";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "../src/components/shared/Modal";
import { Button } from "../src/components/ui/button";

describe("SegmentedControl", () => {
  function Single() {
    const [view, setView] = React.useState("grid");
    return (
      <SegmentedControl type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="View">
        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
        <SegmentedControlItem value="list">List</SegmentedControlItem>
        <SegmentedControlItem value="map">Map</SegmentedControlItem>
      </SegmentedControl>
    );
  }

  it("single: picks one, keeps it when clicked again (caller guards the empty value)", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const list = screen.getByRole("radio", { name: "List" });

    await user.click(list);
    expect(list).toBeChecked();
    expect(screen.getByRole("radio", { name: "Grid" })).not.toBeChecked();

    await user.click(list);
    expect(list).toBeChecked();
  });

  it("single: arrow keys move focus between items (roving focus)", async () => {
    const user = userEvent.setup();
    render(<Single />);
    await user.click(screen.getByRole("radio", { name: "Grid" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "List" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Map" })).toHaveFocus();
  });

  it("multiple: toggles items independently", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Multi() {
      const [v, setV] = React.useState<string[]>(["a"]);
      return (
        <SegmentedControl
          type="multiple"
          variant="outline"
          value={v}
          onValueChange={(next) => {
            setV(next);
            onChange(next);
          }}
          aria-label="Sites"
        >
          <SegmentedControlItem value="a">Site A</SegmentedControlItem>
          <SegmentedControlItem value="b">Site B</SegmentedControlItem>
        </SegmentedControl>
      );
    }
    render(<Multi />);
    await user.click(screen.getByRole("button", { name: "Site B" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    await user.click(screen.getByRole("button", { name: "Site A" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
    expect(screen.getByRole("button", { name: "Site B" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("TimeSelect", () => {
  it("commits the picked time on OK and leaves it unchanged on Cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeSelect value="08:00" onChange={onChange} aria-label="Opening time" />);

    await user.click(screen.getByRole("button", { name: "Opening time" }));
    await user.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "09" }));
    await user.click(within(screen.getByRole("listbox", { name: "Min" })).getByRole("option", { name: "30" }));
    await user.click(within(screen.getByRole("listbox", { name: "AM/PM" })).getByRole("option", { name: "PM" }));
    expect(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "09" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onChange).toHaveBeenCalledWith("21:30");

    // Cancel: the draft is thrown away
    await user.click(screen.getByRole("button", { name: "Opening time" }));
    await user.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "11" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("Modal", () => {
  function Demo() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Add camera</Button>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalHeader title="Add camera" description="Register a camera" />
            <ModalBody>
              <input aria-label="Camera name" />
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  it("is a named dialog, traps Tab inside, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Add camera" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Add camera" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    // Tab many times: focus never leaves the dialog
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Radix restores focus to the opener just after the dialog unmounts
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
