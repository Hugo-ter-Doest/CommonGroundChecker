import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CheckResult } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getFileContent: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getFileContent: mocks.getFileContent,
}));

import { checkFiveLayer } from "@/lib/checkers/fiveLayer";

describe("checkFiveLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes when the repository clearly targets a single layer", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "This repository provides a frontend portal built with React and Next.js."
    );

    const result = await checkFiveLayer(
      "org",
      "repo",
      ["src/frontend/app.tsx", "README.md"],
      { topics: [], description: "" }
    );

    expect(result.status).toBe("pass");
    expect(result.evidence).toEqual([
      "Found path segment \"frontend\" in src/frontend/app.tsx",
      "Found \"frontend\" in repository metadata and docs",
    ]);
    expect(result.message).toContain("Interaction layer");
  });

  it("warns when the repository contains multiple layer signals", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "This project contains a web portal and a backend API service."
    );

    const result = await checkFiveLayer(
      "org",
      "repo",
      ["src/ui/index.js", "services/api/index.js", "README.md"],
      { topics: [], description: "" }
    );

    expect(result.status).toBe("warn");
    expect(result.message).toContain("appears to span multiple Common Ground layers");
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("ui"),
        expect.stringContaining("api"),
      ])
    );
  });

  it("warns when no layer signal is detected", async () => {
    mocks.getFileContent.mockResolvedValueOnce("A general purpose utility library.");

    const result = await checkFiveLayer(
      "org",
      "repo",
      ["README.md", "lib/utils.ts"],
      { topics: ["library"], description: "A reusable utility package." }
    );

    expect(result.status).toBe("warn");
    expect(result.message).toContain("Could not determine the architectural layer");
    expect(result.evidence).toEqual([]);
  });

  it("uses publiccode.yml content to detect the layer", async () => {
    mocks.getFileContent.mockResolvedValueOnce(
      "name: Example\ncategory: service\ndescription: Backend microservice for registration"
    );

    const result = await checkFiveLayer(
      "org",
      "repo",
      ["publiccode.yml", "src/main.js"],
      { topics: [], description: "" }
    );

    expect(result.status).toBe("pass");
    expect(result.evidence).toEqual([
      "Found \"service\" in repository metadata and docs",
    ]);
    expect(result.message).toContain("Service layer");
  });
});
