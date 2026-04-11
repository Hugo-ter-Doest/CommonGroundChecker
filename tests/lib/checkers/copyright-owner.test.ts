import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFileContent: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getFileContent: mocks.getFileContent,
}));

import { checkCopyrightOwner } from "@/lib/checkers/copyrightOwner";

describe("checkCopyrightOwner", () => {
  it("detects probable owner from copyright statement", async () => {
    mocks.getFileContent.mockResolvedValue("Copyright (c) 2024 Gemeente Utrecht");

    const result = await checkCopyrightOwner(
      "org",
      "repo",
      { owner: { login: "org" } },
      ["COPYRIGHT"]
    );

    expect(result.status).toBe("pass");
    expect(result.confidence).toBe("high");
    expect(result.message).toContain("Gemeente Utrecht");
    expect(result.evidence).toContain("COPYRIGHT: Gemeente Utrecht");
  });

  it("detects owner from package metadata when copyright line is missing", async () => {
    mocks.getFileContent.mockResolvedValue(
      JSON.stringify({ author: { name: "VNG Realisatie" } })
    );

    const result = await checkCopyrightOwner(
      "org",
      "repo",
      { owner: { login: "org" } },
      ["package.json"]
    );

    expect(result.status).toBe("pass");
    expect(result.confidence).toBe("medium");
    expect(result.message).toContain("VNG Realisatie");
  });

  it("falls back to repository owner when explicit evidence is missing", async () => {
    mocks.getFileContent.mockResolvedValue(null);

    const result = await checkCopyrightOwner(
      "org",
      "repo",
      { owner: { login: "maykinmedia" } },
      []
    );

    expect(result.status).toBe("warn");
    expect(result.confidence).toBe("low");
    expect(result.message).toContain("Fallback based on repository ownership: maykinmedia");
  });

  it("ignores legal boilerplate and keeps only plausible owner names", async () => {
    mocks.getFileContent.mockResolvedValue(
      "Copyright 2018 VNG Realisatie, holder of the Work)\\n" +
      "Nothing in this Licence is intended to deprive the Licensee of the benefits"
    );

    const result = await checkCopyrightOwner(
      "org",
      "repo",
      { owner: { login: "org" } },
      ["LICENSE"]
    );

    expect(result.status).toBe("pass");
    expect(result.message).toContain("VNG Realisatie");
    expect(result.message).not.toContain("holder of the Work");
    expect(result.message).not.toContain("Licensee");
  });
});