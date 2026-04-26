import { describe, expect, it } from "vitest";
import { checkChangelog } from "@/lib/checkers/changelog";

describe("changelog checker", () => {
  it("passes when changelog.rst exists", () => {
    const result = checkChangelog(["CHANGELOG.rst", "src/index.ts"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain("changelog.rst");
  });

  it("passes when release_notes.rst exists", () => {
    const result = checkChangelog(["docs/release_notes.rst"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain("docs/release_notes.rst");
  });
});
