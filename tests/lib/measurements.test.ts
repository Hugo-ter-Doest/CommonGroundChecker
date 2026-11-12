import { describe, expect, it } from "vitest";
import { measurementsForAspect, parseMeasurements } from "@/lib/measurements";
import { mapMaintainabilityReport, type MaintainabilityReport } from "@/lib/checkers/maintainability";
import openZaakFixture from "../fixtures/maintainability-report-open-zaak.json";

describe("parseMeasurements", () => {
  it("reads back the measurements of a stored maintainability result", () => {
    const { measurements } = mapMaintainabilityReport(openZaakFixture as unknown as MaintainabilityReport);
    const stored = JSON.parse(JSON.stringify(measurements));

    expect(parseMeasurements(stored)).toEqual(measurements);
  });

  it("leaves out malformed groups, rows, thresholds and stars", () => {
    const parsed = parseMeasurements([
      { id: "freshness", title: "Dependency freshness", aspects: ["freshness", 3], rows: [
        { label: "> 1 year", value: "24.5%", thresholds: { 4: "≤ 20%", 1: "x", 3: 7 }, stars: 9 },
        { label: "no value" },
      ] },
      { id: "empty", title: "Empty", aspects: [], rows: [] },
      { title: "No id", rows: [] },
      "nonsense",
    ]);

    expect(parsed).toEqual([
      {
        id: "freshness",
        title: "Dependency freshness",
        aspects: ["freshness"],
        rows: [{ label: "> 1 year", value: "24.5%", thresholds: { 4: "≤ 20%" }, stars: null }],
      },
    ]);
  });

  it("is undefined for a result without measurements", () => {
    expect(parseMeasurements(undefined)).toBeUndefined();
    expect(parseMeasurements([])).toBeUndefined();
  });
});

describe("measurementsForAspect", () => {
  it("picks the groups that count in the aspect", () => {
    const groups = [
      { id: "a", title: "A", aspects: ["testability"], rows: [] },
      { id: "b", title: "B", aspects: ["reusability"], rows: [] },
    ];

    expect(measurementsForAspect(groups, "testability").map((group) => group.id)).toEqual(["a"]);
    expect(measurementsForAspect(undefined, "testability")).toEqual([]);
  });
});
