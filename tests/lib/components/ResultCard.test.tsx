/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ResultCard from "@/components/ResultCard";

function renderCard(props: Partial<Parameters<typeof ResultCard>[0]> = {}) {
  return render(
    <ResultCard
      id="complexity"
      title="Cyclomatic complexity (Lizard)"
      description="Tracks cyclomatic complexity."
      status="fail"
      message="Average CCN above the threshold."
      {...props}
    />
  );
}

describe("ResultCard", () => {
  afterEach(() => cleanup());

  it("shows a failing informative criterion as information, without a red fail badge", () => {
    const { container } = renderCard({ requirementLevel: "informative" });

    expect(screen.queryByText("Fail")).toBeNull();
    expect(screen.getByText("Info")).toBeTruthy();
    expect(container.querySelector(".bg-red-50, .border-red-300")).toBeNull();
    expect((container.firstElementChild as HTMLElement).className).toContain("bg-blue-50");
  });

  it("keeps the fail badge for a recommended or mandatory criterion", () => {
    renderCard({ requirementLevel: "recommended" });

    expect(screen.getByText("Fail")).toBeTruthy();
  });
});
