import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FilterPills } from "./FilterPills";

function Harness() {
  const [value, setValue] = useState("vic");
  return (
    <FilterPills
      label="State"
      value={value}
      onChange={setValue}
      options={[
        { id: "vic", label: "VIC", labelLong: "Victoria" },
        { id: "qld", label: "QLD", labelLong: "Queensland" },
      ]}
    />
  );
}

describe("FilterPills", () => {
  it("moves the selection with arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const victoria = screen.getByRole("radio", { name: "Victoria" });
    victoria.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Queensland" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(victoria).toHaveAttribute("aria-checked", "false");
  });
});
