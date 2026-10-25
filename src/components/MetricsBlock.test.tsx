import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { registry } from "../metrics/registry";
import { MetricsBlock } from "./MetricsBlock";

describe("MetricsBlock", () => {
  it("shows configured rows without inventing values", () => {
    const housing = registry.find((section) => section.id === "housing");
    if (!housing) throw new Error("housing section missing");
    render(<MetricsBlock config={housing} payload={null} />);
    expect(screen.getByText("Median weekly rent")).toBeInTheDocument();
    expect(screen.getByText("No figures are on file for this section.")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
