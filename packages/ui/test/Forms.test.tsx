import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalField, ModalPasswordInput, ModalSelect, ModalTextInput } from "../src/components/shared/ModalForm";
import { ToolbarSearch } from "../src/components/shared/Toolbar";
import { OtpField } from "../src/components/shared/OtpField";
import { Slider } from "../src/components/ui/slider";

describe("ModalField", () => {
  it("links its label to text, password and select controls", () => {
    render(
      <>
        <ModalField label="IP address">
          <ModalTextInput value="10.0.0.1" onChange={() => {}} />
        </ModalField>
        <ModalField label="Password">
          <ModalPasswordInput value="" onChange={() => {}} />
        </ModalField>
        <ModalField label="Site">
          <ModalSelect value="" onChange={() => {}} placeholder="Choose" options={[{ value: "a", label: "A" }]} />
        </ModalField>
      </>
    );
    expect(screen.getByLabelText("IP address")).toHaveValue("10.0.0.1");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("combobox", { name: "Site" })).toBeInTheDocument();
  });
});

describe("ToolbarSearch", () => {
  it("is named by its placeholder by default and reports typed text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Demo() {
      const [v, setV] = React.useState("");
      return <ToolbarSearch value={v} onChange={(n) => { setV(n); onChange(n); }} placeholder="Search cameras…" />;
    }
    render(<Demo />);
    const box = screen.getByRole("textbox", { name: "Search cameras…" });
    await user.type(box, "dock");
    expect(onChange).toHaveBeenLastCalledWith("dock");
  });

  it("keeps an explicit aria-label", () => {
    render(<ToolbarSearch value="" onChange={() => {}} aria-label="Search incidents" />);
    expect(screen.getByRole("textbox", { name: "Search incidents" })).toBeInTheDocument();
  });
});

describe("OtpField", () => {
  it("fills digits as the user types", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [v, setV] = React.useState("");
      return (
        <>
          <OtpField value={v} onChange={setV} length={6} aria-label="Verification code" autoFocus />
          <output data-testid="value">{v}</output>
        </>
      );
    }
    render(<Demo />);
    await user.keyboard("123456");
    expect(screen.getByTestId("value")).toHaveTextContent("123456");
  });
});

describe("Slider", () => {
  it("names the thumb (role=slider), and range thumbs get minimum / maximum", () => {
    render(
      <>
        <Slider aria-label="Confidence" defaultValue={[50]} />
        <Slider aria-label="Hours" defaultValue={[8, 18]} max={24} />
      </>
    );
    expect(screen.getByRole("slider", { name: "Confidence" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Hours minimum" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Hours maximum" })).toBeInTheDocument();
  });
});
