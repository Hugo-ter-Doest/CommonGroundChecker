import { describe, expect, it } from "vitest";
import { describeUsageSource, readUsageData, shownUsageSources } from "@/lib/usage";
import type { UsageSource } from "@/lib/types";

const SOURCE: UsageSource = {
  id: "npm",
  kind: "downloads",
  source: "npm",
  subject: "openzaak",
  url: "https://www.npmjs.com/package/openzaak",
  measuredAt: "2026-11-18",
  caveat: "Includes CI builds.",
  figures: [{ label: "downloads in the last month", value: 1234567 }],
};

describe("readUsageData", () => {
  it("reads stored usage data and drops malformed sources and figures", () => {
    const data = readUsageData({
      sources: [
        { ...SOURCE, figures: [...SOURCE.figures, { label: "broken", value: "12" }] },
        { ...SOURCE, kind: "ranking" },
        { id: "x" },
        "text",
      ],
    });

    expect(data).toEqual({ sources: [SOURCE] });
  });

  it("is undefined for an analysis without usage data", () => {
    expect(readUsageData(undefined)).toBeUndefined();
    expect(readUsageData({ sources: "none" })).toBeUndefined();
  });
});

describe("shownUsageSources", () => {
  it("orders the sources by kind and keeps the order within a kind", () => {
    const declared = { ...SOURCE, id: "publiccode-usedby", kind: "declared" as const };
    const stars = { ...SOURCE, id: "repository", kind: "ecosystem" as const };
    const pypi = { ...SOURCE, id: "pypi" };

    expect(shownUsageSources({ sources: [stars, SOURCE, declared, pypi] }).map((s) => s.id)).toEqual([
      "publiccode-usedby",
      "npm",
      "pypi",
      "repository",
    ]);
    expect(shownUsageSources(undefined)).toEqual([]);
  });
});

describe("describeUsageSource", () => {
  it("joins the figures, or says why the source was not measured", () => {
    expect(describeUsageSource(SOURCE)).toBe("1,234,567 downloads in the last month");
    expect(describeUsageSource({ ...SOURCE, figures: [], notMeasured: "HTTP 503" })).toBe("not measured: HTTP 503");
    expect(describeUsageSource({ ...SOURCE, summary: "4 contributors; organisation unknown for most (3 of 4)" })).toBe(
      "4 contributors; organisation unknown for most (3 of 4)"
    );
    expect(readUsageData({ sources: [{ ...SOURCE, summary: "kept" }] })?.sources[0].summary).toBe("kept");
  });
});
