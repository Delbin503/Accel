import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Banner } from "../src/components/shared/Banner";

describe("Banner", () => {
  it("announces critical banners as alerts and the rest as status", () => {
    const { rerender } = render(<Banner tone="critical">Card declined.</Banner>);
    expect(screen.getByRole("alert")).toHaveTextContent("Card declined.");
    rerender(<Banner tone="info" title="Plan changed">Now 5 seats.</Banner>);
    expect(screen.getByRole("status")).toHaveTextContent("Plan changed Now 5 seats.");
  });

  it("calls onDismiss from a labelled × button, and has none without it", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Banner tone="warning" onDismiss={onDismiss} dismissLabel="Dismiss alert">
        Memory at 68%.
      </Banner>
    );
    await userEvent.click(screen.getByRole("button", { name: "Dismiss alert" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    rerender(<Banner tone="warning">Memory at 68%.</Banner>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
