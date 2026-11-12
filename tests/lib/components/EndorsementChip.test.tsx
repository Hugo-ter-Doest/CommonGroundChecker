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
});
