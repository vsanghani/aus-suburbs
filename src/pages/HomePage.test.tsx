import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { site } from "../config/site";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("leads with search and does not invent a ranking", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.name);
    expect(
      screen.getByRole("searchbox", { name: "Suburb, council, or postcode" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/#1/)).not.toBeInTheDocument();
  });
});
