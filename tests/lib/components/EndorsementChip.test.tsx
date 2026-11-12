/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import EndorsementChip from "@/components/EndorsementChip";

describe("EndorsementChip", () => {
  afterEach(() => cleanup());

  it("says when the component passes", () => {
    render(<EndorsementChip endorsement={{ passed: true, reasons: [] }} />);

    expect(screen.getByText("Passes")).toBeTruthy();
  });

  it("says when the component does not pass", () => {
    render(<EndorsementChip endorsement={{ passed: false, reasons: ["Overall rating below 2.5"] }} />);

    expect(screen.getByText("Does not pass")).toBeTruthy();
  });

  it("lists why the component does not pass when asked to", () => {
    render(
      <EndorsementChip
        endorsement={{ passed: false, reasons: ["Mandatory criterion fails: License", "Overall rating below 2.5"] }}
        showReasons
      />
    );

    const reasons = screen.getByRole("list", { name: "Why it does not pass" });
    expect(reasons.textContent).toBe("Mandatory criterion fails: LicenseOverall rating below 2.5");
  });

  it("lists no reasons by default or when the component passes", () => {
    render(<EndorsementChip endorsement={{ passed: false, reasons: ["Overall rating below 2.5"] }} />);
    render(<EndorsementChip endorsement={{ passed: true, reasons: [] }} showReasons />);

    expect(screen.queryByRole("list")).toBeNull();
  });
});
