/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import CategoryRatings from "@/components/CategoryRatings";
import { mapMaintainabilityReport, type MaintainabilityReport } from "@/lib/checkers/maintainability";
import { resolveCategory } from "@/lib/aspects";
import type { CheckResult } from "@/lib/types";
import openZaakFixture from "../../fixtures/maintainability-report-open-zaak.json";

const MAINTAINABILITY = resolveCategory("Maintainability") as string;

function result(id: string, status: CheckResult["status"]): CheckResult {
  return { id, title: `${id} title`, description: "", status, message: "" };
}

const maintainability = mapMaintainabilityReport(openZaakFixture as unknown as MaintainabilityReport);

function renderRatings() {
  return render(
    <CategoryRatings
      results={[maintainability, result("license", "pass"), result("eupllicense", "warn"), result("documentation", "pass")]}
      categoryRatings={{ Governance: 3.8, [MAINTAINABILITY]: 2.6 }}
      aspectRatings={{
        licensing: { rating: 4 },
        "community-documents": { rating: 4, found: 4, expected: 5 },
        testability: { rating: 1.76 },
        ownership: { rating: null },
      }}
    />
  );
}

describe("CategoryRatings", () => {
  afterEach(() => cleanup());

  it("draws a meter per rated aspect on the 0.5 to 5.5 scale", () => {
    renderRatings();

    const meter = screen.getByRole("meter", { name: "Testability 1.8 of 5.5" });
    expect(meter.getAttribute("aria-valuemin")).toBe("0.5");
    expect(meter.getAttribute("aria-valuemax")).toBe("5.5");
    expect(meter.getAttribute("aria-valuenow")).toBe("1.76");
    expect((meter.firstElementChild as HTMLElement).style.width).toBe("25.2%");
    expect(meter.querySelectorAll("span[aria-hidden='true']")).toHaveLength(4);
  });

  it("says not measured for an aspect without a rating, without a meter", () => {
    renderRatings();

    const ownership = screen.getByRole("group", { name: "Ownership" });
    expect(within(ownership).queryByRole("meter")).toBeNull();
    expect(within(ownership).getByText("not measured")).toBeTruthy();
  });

  it("links each category and aspect to its page in the rating guide", () => {
    renderRatings();

    expect(screen.getByRole("link", { name: "Governance" }).getAttribute("href")).toBe("/docs/governance");
    expect(screen.getByRole("link", { name: MAINTAINABILITY }).getAttribute("href")).toBe("/docs/maintainability");
    expect(screen.getByRole("link", { name: "Testability" }).getAttribute("href")).toBe("/docs/maintainability#testability");
    expect(screen.getByRole("link", { name: "Community documents" }).getAttribute("href")).toBe(
      "/docs/governance#community-documents"
    );
  });

  it("shows the category stars and number", () => {
    renderRatings();

    expect(screen.getByRole("img", { name: "Governance rating 3.8 of 5" })).toBeTruthy();
  });

  it("puts the measurements with their thresholds under a maintainability aspect", () => {
    renderRatings();

    const table = screen.getByRole("table", { name: "What Testability is made of" });
    const headers = within(table).getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Measured",
      "Value",
      "★★★★★5 stars",
      "★★★★☆4 stars",
      "★★★☆☆3 stars",
      "★★☆☆☆2 stars",
      "Earned",
    ]);
    expect(within(table).getByRole("rowheader", { name: "Unit complexity" }).getAttribute("scope")).toBe("rowgroup");
    const row = within(table).getByRole("row", { name: /Python, complexity above 5/ });
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "34.8%",
      "≤ 15.8%",
      "≤ 20.7%",
      "≤ 27.7%",
      "≤ 34.6%",
      "★☆☆☆☆1 star",
    ]);
    const independence = within(table).getByRole("row", { name: /^Python 81.1%/ });
    expect(within(independence).getAllByText("no level")).toHaveLength(2);
    expect(within(independence).getByText("below 4 stars")).toBeTruthy();
  });

  it("lists the documents of a document-count aspect as found or missing", () => {
    renderRatings();

    const group = screen.getByRole("group", { name: "Community documents" });
    expect(within(group).getByText("4 of 5 found")).toBeTruthy();
    const table = within(group).getByRole("table", { name: "What Community documents is made of" });
    expect(within(table).getByRole("row", { name: /documentation title.*Found/ })).toBeTruthy();
  });

  it("lists the criteria of a normal aspect with status, stars and a link to the card", () => {
    renderRatings();

    const table = screen.getByRole("table", { name: "What Licensing is made of" });
    const row = within(table).getByRole("row", { name: /eupllicense title/ });
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Warning", "★★★☆☆3 stars 3.0"]);
    expect(within(row).getByRole("link").getAttribute("href")).toBe("#criterion-eupllicense");
  });
});
