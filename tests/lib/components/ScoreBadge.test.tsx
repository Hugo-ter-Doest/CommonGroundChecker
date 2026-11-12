/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ScoreBadge from "@/components/ScoreBadge";

describe("ScoreBadge", () => {
  afterEach(() => cleanup());

  it("is labelled as the compliance score", () => {
    render(<ScoreBadge score={71} />);

    expect(screen.getByText("Compliance score")).toBeTruthy();
    expect(screen.getByText("71")).toBeTruthy();
  });
});
