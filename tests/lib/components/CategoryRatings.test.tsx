/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import CategoryRatings from "@/components/CategoryRatings";
import { mapMaintainabilityReport, type MaintainabilityReport } from "@/lib/checkers/maintainability";
import { resolveCategory } from "@/lib/aspects";
import type { CheckResult, SizeMeasurement } from "@/lib/types";
import { mapSize } from "@/lib/checkers/size";
import openZaakFixture from "../../fixtures/maintainability-report-open-zaak.json";
import openZaakSizeFixture from "../../fixtures/size-open-zaak.json";

const MAINTAINABILITY = resolveCategory("Maintainability") as string;

function result(id: string, status: CheckResult["status"]): CheckResult {
  return { id, title: `${id} title`, description: "", status, message: "" };
}

const maintainability = mapMaintainabilityReport(openZaakFixture as unknown as MaintainabilityReport);
const size = mapSize(openZaakSizeFixture as SizeMeasurement);

function renderRatings(extra: CheckResult[] = [size]) {
  return render(
    <CategoryRatings
      results={[
        maintainability,
        result("license", "pass"),
        result("eupllicense", "warn"),
        result("documentation", "pass"),
        ...extra,
      ]}
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

  it("draws a meter per rated aspect on the 0.5 to 5.5 scale, with white ticks on the fill", () => {
    renderRatings();

    const meter = screen.getByRole("meter", { name: "Testability 1.8 of 5.5" });
    expect(meter.getAttribute("aria-valuemin")).toBe("0.5");
    expect(meter.getAttribute("aria-valuemax")).toBe("5.5");
    expect(meter.getAttribute("aria-valuenow")).toBe("1.76");
    expect((meter.firstElementChild as HTMLElement).style.width).toBe("25.2%");
    const ticks = Array.from(meter.querySelectorAll("span[aria-hidden='true']"));
    expect(ticks).toHaveLength(4);
    expect(ticks.map((tick) => tick.className.includes("bg-white"))).toEqual([true, false, false, false]);
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

    expect(screen.getByRole("img", { name: "Governance rating 3.8 of 5.5, 4 stars" })).toBeTruthy();
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

  it("keeps each aspect's table collapsed under its bar, with a labelled summary", () => {
    renderRatings();

    const table = screen.getByRole("table", { name: "What Licensing is made of" });
    const details = table.closest("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toBe("Show what Licensing is made of");
  });

  it("shows the size as lines of code, not rated, with the languages and both effort figures", () => {
    renderRatings();

    const group = screen.getByRole("group", { name: /^Size/ });
    expect(within(group).queryByRole("meter")).toBeNull();
    expect(within(group).getByText("(informative, not rated)")).toBeTruthy();
    expect(within(group).getByText("42,010 lines of code, not rated")).toBeTruthy();
    const table = within(group).getByRole("table", { name: /What Size is made of: production code, counted with scc 4.1.0/ });
    const python = within(table).getByRole("row", { name: /^Python/ });
    expect(within(python).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["342", "38,066"]);
    expect(within(group).getByText(/^4.1 person-years \(914 function points/)).toBeTruthy();
    expect(within(group).getByText(/^6.4 person-years, from the SIG v17.0/).textContent).toContain(
      "Context, not part of the 2026 rating."
    );
  });

  it("says why the size was not measured", () => {
    renderRatings([{ ...result("size", "info"), message: "Not measured: scc 4.1.0 could not run." }]);

    const group = screen.getByRole("group", { name: /^Size/ });
    expect(within(group).getByText("not measured")).toBeTruthy();
    expect(within(group).getByText("Not measured: scc 4.1.0 could not run.")).toBeTruthy();
  });

  it("marks a rated aspect with weight 0 as not counted", () => {
    renderRatings();

    expect(screen.getByRole("heading", { name: /^Layering\s*\(not counted\)$/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "API" })).toBeTruthy();
  });
});
