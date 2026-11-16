import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "../src/components/shared/DetailDrawer";
import { DescriptionItem, DescriptionList } from "../src/components/shared/DescriptionList";

function Demo() {
  const [open, setOpen] = React.useState(true);
  return (
    <DetailDrawer open={open} onOpenChange={setOpen} data-slot="camera-drawer">
      <DetailDrawerHeader>
        <DetailDrawerTitle>Loading Bay 3</DetailDrawerTitle>
        <DetailDrawerDescription>CAM-015 · Changi Hub</DetailDrawerDescription>
      </DetailDrawerHeader>
      <DetailDrawerBody>
        <DetailDrawerSection title="Device">
          <DescriptionList>
            <DescriptionItem label="IP address" mono>10.20.4.15</DescriptionItem>
            <DescriptionItem label="Last seen" />
          </DescriptionList>
        </DetailDrawerSection>
      </DetailDrawerBody>
    </DetailDrawer>
  );
}

describe("DetailDrawer", () => {
  it("is a named dialog with a page slot, and its close button closes it", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const dialog = screen.getByRole("dialog", { name: "Loading Bay 3" });
    expect(dialog).toHaveAttribute("data-slot", "camera-drawer");
    expect(dialog).toHaveAccessibleDescription("CAM-015 · Changi Hub");
    expect(screen.getByRole("region", { name: "Device" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("DescriptionList", () => {
  it("pairs labels and values in a <dl> and shows an em dash for empty values", () => {
    render(<Demo />);
    const terms = screen.getAllByRole("term");
    const defs = screen.getAllByRole("definition");
    expect(terms.map((t) => t.textContent)).toEqual(["IP address", "Last seen"]);
    expect(defs[0]).toHaveTextContent("10.20.4.15");
    expect(defs[1]).toHaveTextContent("—");
  });
});
