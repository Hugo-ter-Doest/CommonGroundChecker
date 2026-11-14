import { describe, expect, it, vi } from "vitest";
import * as github from "@/lib/github";
import { checkOwaspSecureCoding, stripCommentLines } from "@/lib/checkers/owaspSecureCoding";

describe("OWASP secure coding checker", () => {
  it("passes when no risky patterns are found", async () => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce(
      "export function safeAdd(a, b) { return a + b; }"
    );

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.status).toBe("pass");
    expect(result.message).toContain("No obvious OWASP-style risky coding patterns");
  });

  it("warns when a risky pattern is detected", async () => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce(
      "const hash = crypto.createHash('md5');"
    );

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.status).toBe("warn");
    expect(result.evidence?.[0]).toContain("Weak hash algorithm");
  });

  it.each([
    ["a PHP closure", "$ids = array_map(function ($item) { return $item->id; }, $items);"],
    ["a JavaScript anonymous function", "items.forEach(function (item) { console.log(item); });"],
    ["a method call named Function", "registry.Function(name);"],
  ])("does not flag %s as dynamic code execution", async (_label, code) => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce(code);

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.status).toBe("pass");
  });

  it.each([
    ["the Function constructor", 'const run = new Function("return 1");'],
    ["eval", "eval(userInput);"],
    ["a string timer", 'setTimeout("doWork()", 10);'],
  ])("flags %s as dynamic code execution", async (_label, code) => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce(code);

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.status).toBe("warn");
    expect(result.evidence?.[0]).toContain("Dynamic code execution");
  });

  it.each([
    ["a PyTorch eval() method", "model.eval()"],
    ["a PHP eval() method", "$result = $parser->eval($expression);"],
    ["a docblock that names eval()", "/**\n * A parser, not eval(), reads these expressions.\n */\nfunction parse() {}"],
    ["a line comment that names eval()", "// never eval() user input\nconst x = 1;"],
    ["a Python comment that names eval()", "# no eval() here\nx = 1"],
  ])("does not flag %s as dynamic code execution", async (_label, code) => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce(code);

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.status).toBe("pass");
  });

  it("still flags the eval built-in", async () => {
    vi.spyOn(github, "getFileContent").mockResolvedValueOnce("const value = eval(input);");

    const result = await checkOwaspSecureCoding("owner", "repo", ["src/main.ts"]);

    expect(result.evidence?.[0]).toContain("Dynamic code execution");
  });

  it("keeps code lines and attribute lines when blanking comments", () => {
    expect(stripCommentLines("#[Route('x')]\n# note\n$a = 1; // eval()\n * doc")).toBe("#[Route('x')]\n\n$a = 1; // eval()\n");
  });
});
