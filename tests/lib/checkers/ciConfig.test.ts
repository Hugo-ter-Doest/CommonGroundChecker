import { describe, expect, it } from "vitest";
import { checkCiConfig } from "@/lib/checkers/ciConfig";

describe("checkCiConfig", () => {
  it("passes when a GitHub Actions workflow file exists", () => {
    const result = checkCiConfig([".github/workflows/build.yml", "README.md"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain(".github/workflows/build.yml");
  });

  it("passes when a GitLab CI file exists", () => {
    const result = checkCiConfig([".gitlab-ci.yml", "README.md"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain(".gitlab-ci.yml");
  });

  it("warns when no CI/CD configuration is present", () => {
    const result = checkCiConfig(["README.md", "src/index.ts"]);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("No common CI/CD configuration files");
  });
});
