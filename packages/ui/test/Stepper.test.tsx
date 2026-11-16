import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stepper } from "../src/components/shared/Stepper";

const STEPS = [
  { id: "a", label: "Account" },
  { id: "b", label: "Plan" },
  { id: "c", label: "Site" },
];

describe("Stepper", () => {
  it("marks done, current and upcoming steps for screen readers", () => {
    render(<Stepper steps={STEPS} current={1} aria-label="Sign-up progress" />);
    const list = screen.getByRole("list", { name: "Sign-up progress" });
    const items = screen.getAllByRole("listitem");
    expect(list).toContainElement(items[0]);
    expect(items.map((i) => i.getAttribute("data-state"))).toEqual(["done", "active", "upcoming"]);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).toHaveTextContent("Account (done)");
    expect(items[1]).toHaveTextContent("Plan (current)");
  });

  it("treats current = steps.length as all done", () => {
    render(<Stepper steps={STEPS} current={STEPS.length} />);
    expect(screen.getAllByRole("listitem").every((i) => i.getAttribute("data-state") === "done")).toBe(true);
    expect(screen.queryByText(/current/)).not.toBeInTheDocument();
  });
});
