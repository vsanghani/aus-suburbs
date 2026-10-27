import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SectionConfig } from "../metrics/registry";
import { MetricSection } from "./MetricSection";

describe("MetricSection", () => {
  it("renders a new section from one config entry", () => {
    const config: SectionConfig = {
      id: "coast",
      nav: "Coast",
      kicker: "18 — Shore",
      title: "Coast",
      lede: "Distance to the shore, and whether a coastal overlay covers the suburb.",
      slots: [{ id: "shore-distance", label: "Distance to shore", unit: "m", map: true }],
    };
    render(<MetricSection config={config} payload={null} nearby={[]} origin={null} score={null} />);
    expect(screen.getByRole("heading", { level: 2, name: "Coast" })).toBeInTheDocument();
    expect(screen.getByText("18 — Shore")).toBeInTheDocument();
    expect(screen.getByText("Distance to shore")).toBeInTheDocument();
    expect(screen.getByText("No figures are on file for this section.")).toBeInTheDocument();
  });
});
