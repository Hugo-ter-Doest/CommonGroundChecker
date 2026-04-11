import { describe, expect, it } from "vitest";
import { checkSourceCode } from "@/lib/checkers/sourcecode";
import { checkSecurity } from "@/lib/checkers/security";
import { checkSemver } from "@/lib/checkers/semver";

describe("core checkers", () => {
  it("passes source code check when repository has source files", () => {
    const result = checkSourceCode([
      "README.md",
      "src/main.ts",
      "package.json",
    ]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("Found 1 source code file");
  });

  it("fails source code check when only non-source files exist", () => {
    const result = checkSourceCode([
      "README.md",
      "package.json",
      "docs/architecture.md",
    ]);

    expect(result.status).toBe("fail");
    expect(result.message).toContain("No source code files detected");
  });

  it("passes security check when SECURITY.md is present", () => {
    const result = checkSecurity(["docs/SECURITY.md", "README.md"]);

    expect(result.status).toBe("pass");
    expect(result.evidence).toContain("docs/SECURITY.md");
  });

  it("warns security check when no security policy exists", () => {
    const result = checkSecurity(["README.md", "src/main.ts"]);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("No SECURITY.md file found");
  });

  it("accepts valid semantic versions and rejects invalid ones", () => {
    expect(checkSemver("v1.2.3").status).toBe("pass");
    expect(checkSemver("1.2").status).toBe("fail");
    expect(checkSemver(null).status).toBe("warn");
  });
});