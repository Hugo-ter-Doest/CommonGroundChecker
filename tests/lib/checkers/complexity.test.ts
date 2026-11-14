import { describe, expect, it } from "vitest";
import { EXCLUDED_DIRECTORIES, lizardExcludeArgs, TEST_CODE_PATTERNS } from "@/lib/checkers/complexity";

describe("lizardExcludeArgs", () => {
  it("excludes dependency, build and generated output", () => {
    const args = lizardExcludeArgs();

    for (const directory of ["vendor", "node_modules", "dist", "build", "coverage", "generated", ".next", ".git"]) {
      expect(args).toContain(`*/${directory}/*`);
    }
    expect(args).toContain("*.min.js");
  });

  it("passes every pattern as its own -x option", () => {
    const args = lizardExcludeArgs();

    expect(args).toHaveLength((EXCLUDED_DIRECTORIES.length + 1 + TEST_CODE_PATTERNS.length) * 2);
    expect(args.filter((_, index) => index % 2 === 0).every((arg) => arg === "-x")).toBe(true);
  });

  it.each([
    ["repo/tests/Unit/ServiceTest.php", true],
    ["repo/tests/stubs/OCP/IConfig.php", true],
    ["repo/src/components/__tests__/Card.spec.ts", true],
    ["repo/src/lib/stars.test.ts", true],
    ["repo/pkg/client_test.go", true],
    ["repo/app/test_views.py", true],
    ["repo/e2e/login.ts", true],
    ["repo/test-utils/render.ts", true],
    ["repo/lib/Service/TestService.php", false],
    ["repo/lib/Service/ContestService.php", false],
    ["repo/src/latest/index.ts", false],
  ])("treats %s as test code: %s", (path, excluded) => {
    const globs = TEST_CODE_PATTERNS.map((pattern) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`));

    expect(globs.some((glob) => glob.test(`/tmp/checkout/${path}`))).toBe(excluded);
  });
});
