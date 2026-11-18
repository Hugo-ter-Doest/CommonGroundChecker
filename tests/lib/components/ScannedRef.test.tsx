/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import ScannedRef from "@/components/ScannedRef";

const SHA = "abc1234def5678abc1234def5678abc1234def56";

describe("ScannedRef", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the scanned branch with its short commit", () => {
    render(<ScannedRef scannedRef="development" kind="branch" commit={SHA} />);

    expect(screen.getByText("Scanned: development @ abc1234")).toBeTruthy();
  });

  it("names a release scan", () => {
    render(<ScannedRef scannedRef="v1.2.0" kind="release" commit={SHA} />);

    expect(screen.getByText("Scanned: release v1.2.0 @ abc1234")).toBeTruthy();
  });

  it("shows the warning when the requested ref was not used", () => {
    render(
      <ScannedRef
        scannedRef="main"
        kind="default-branch"
        commit={null}
        warning="No stable release or semver tag was found"
      />
    );

    expect(screen.getByText("Scanned: main (default branch)")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("No stable release");
  });

  it("renders nothing for an analysis stored before the scanned ref was recorded", () => {
    const { container } = render(<ScannedRef scannedRef={null} />);

    expect(container.textContent).toBe("");
  });
});
