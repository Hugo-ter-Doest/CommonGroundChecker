/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RatingBadge from "@/components/RatingBadge";

describe("RatingBadge", () => {
  afterEach(() => cleanup());

  it("shows the stars and the number with an accessible label", () => {
    render(<RatingBadge rating={3.4} size="large" />);

    const badge = screen.getByRole("img", { name: "Overall rating 3.4 of 5.5, 3 stars" });
    expect(badge.textContent).toBe("★★★☆☆3.4");
  });

  it("rounds x.5 up to the next star", () => {
    render(<RatingBadge rating={3.5} label="Governance rating" />);

    const badge = screen.getByRole("img", { name: "Governance rating 3.5 of 5.5, 4 stars" });
    expect(badge.textContent).toBe("★★★★☆3.5");
  });

  it("says when there is no rating", () => {
    render(<RatingBadge rating={null} label="Security rating" />);

    expect(screen.getByRole("img", { name: "Security rating: not rated" }).textContent).toBe("Not rated");
  });
});
