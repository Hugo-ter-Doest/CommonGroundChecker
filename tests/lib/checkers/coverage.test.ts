import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkCoverage } from "@/lib/checkers/coverage";

const mocks = vi.hoisted(() => ({
  getFileContent: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getFileContent: mocks.getFileContent,
}));

describe("checkCoverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns warn when no coverage file is present", async () => {
    const result = await checkCoverage("org", "repo", ["README.md"]);

    expect(result.id).toBe("coverage");
    expect(result.status).toBe("warn");
    expect(result.message).toContain("No coverage report file was found");
  });

  it("returns pass when coverage summary JSON meets threshold", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      JSON.stringify({
        total: { lines: { pct: 82.5 } },
      })
    );

    const result = await checkCoverage("org", "repo", ["coverage/coverage-summary.json"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("82.50%");
    expect(result.evidence).toContain("coverage/coverage-summary.json: 82.50%");
  });

  it("returns fail when lcov info is below threshold", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "LF:10\nLH:6\n"
    );

    const result = await checkCoverage("org", "repo", ["coverage/lcov.info"]);

    expect(result.status).toBe("fail");
    expect(result.message).toContain("60.00%");
    expect(result.evidence).toContain("coverage/lcov.info: 60.00%");
  });

  it("detects coverage from a README badge when no report file exists", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "![Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen)"
    );

    const result = await checkCoverage("org", "repo", ["README.md"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("84.00%");
    expect(result.evidence).toContain("README coverage badge: 84.00%");
  });

  it("ignores non-coverage badges in README", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "![Tests](https://img.shields.io/badge/tests-100%25-brightgreen)"
    );

    const result = await checkCoverage("org", "repo", ["README.md"]);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("No coverage report file was found");
  });

  it("detects coverage from a Codecov badge URL in README", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "[![Coverage](https://codecov.io/gh/open-zaak/open-zaak/branch/main/graph/badge.svg)](https://codecov.io/gh/open-zaak/open-zaak)"
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        "<svg><text>Coverage<\/text><text>84%<\/text><\/svg>",
    });
    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      writable: true,
      configurable: true,
    });

    const result = await checkCoverage("org", "repo", ["README.md"]);

    expect(fetchMock).toHaveBeenCalled();
    expect(result.status).toBe("pass");
    expect(result.message).toContain("84.00%");
    expect(result.evidence).toContain("README coverage badge: 84.00%");
  });

  it("ignores generic Codecov repository URLs in README", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "[![Codecov](https://codecov.io/gh/open-zaak/open-zaak)](https://codecov.io/gh/open-zaak/open-zaak)"
    );

    const fetchMock = vi.fn();
    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      writable: true,
      configurable: true,
    });

    const result = await checkCoverage("org", "repo", ["README.md"]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.status).toBe("warn");
    expect(result.message).toContain("No coverage report file was found");
  });
});
