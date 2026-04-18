import { describe, expect, it } from "vitest";
import { formatSpectralIssue } from "@/lib/checkers/adrValidator";

describe("formatSpectralIssue", () => {
  it("formats a Spectral issue with code, severity, path and source", () => {
    const issue = {
      code: "operation-ids",
      message: "Operation IDs must be unique.",
      path: ["paths", "/pets", "get", "operationId"],
      severity: 1,
      source: "openapi.yaml",
    };

    expect(formatSpectralIssue(issue)).toBe(
      "ERROR [operation-ids] Operation IDs must be unique. @ paths./pets.get.operationId (openapi.yaml)"
    );
  });

  it("formats a Spectral issue without code or source", () => {
    const issue = {
      message: "Unsupported type detected.",
      severity: 2,
      path: ["components", "schemas", "Pet"],
    };

    expect(formatSpectralIssue(issue)).toBe(
      "WARNING Unsupported type detected. @ components.schemas.Pet"
    );
  });

  it("formats a Spectral issue without path", () => {
    const issue = {
      code: "info-contact",
      message: "Info object should contain contact information.",
      severity: 0,
    };

    expect(formatSpectralIssue(issue)).toBe(
      "HINT [info-contact] Info object should contain contact information."
    );
  });
});
