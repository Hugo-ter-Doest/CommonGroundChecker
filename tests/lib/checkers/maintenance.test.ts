import { describe, expect, it } from "vitest";
import { checkMaintenance, judgeMaintenance } from "@/lib/checkers/maintenance";
import type { RepoContext } from "@/lib/providers/types";

const TODAY = "2026-11-16";

function contextWith(content: string | null): RepoContext {
  return {
    owner: "org",
    repo: "repo",
    projectPath: "org/repo",
    repoUrl: "https://github.com/org/repo",
    provider: { getFileContent: async () => content },
  } as unknown as RepoContext;
}

describe("judgeMaintenance", () => {
  it("fails when nobody maintains the component", () => {
    const result = judgeMaintenance({ maintenance: { type: "none" } }, "publiccode.yml", TODAY);

    expect(result.status).toBe("fail");
    expect(result.message).toContain("nobody maintains");
  });

  it("passes on a current maintenance contract", () => {
    const result = judgeMaintenance(
      { maintenance: { type: "contract", contractors: [{ name: "Acme", until: "2027-06-30" }] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("pass");
    expect(result.message).toBe("Maintained under contract by Acme until 2027-06-30.");
  });

  it("passes on a contract that ends today", () => {
    const result = judgeMaintenance(
      { maintenance: { type: "contract", contractors: [{ name: "Acme", until: TODAY }] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("pass");
  });

  it("fails when every maintenance contract has ended, naming the last end date", () => {
    const result = judgeMaintenance(
      {
        maintenance: {
          type: "contract",
          contractors: [
            { name: "Acme", until: "2024-12-31" },
            { name: "Beta", until: new Date("2025-06-30") },
          ],
        },
      },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("fail");
    expect(result.message).toBe("The maintenance contract ended on 2025-06-30.");
    expect(result.evidence).toEqual(["Acme, until 2024-12-31", "Beta, until 2025-06-30"]);
  });

  it("passes when one of several contracts is still current", () => {
    const result = judgeMaintenance(
      {
        maintenance: {
          type: "contract",
          contractors: [
            { name: "Acme", until: "2024-12-31" },
            { name: "Beta", until: "2027-01-01" },
          ],
        },
      },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("pass");
    expect(result.message).toContain("Beta until 2027-01-01");
  });

  it.each([
    ["without an end date", { name: "Acme" }],
    ["with an invalid end date", { name: "Acme", until: "soon" }],
  ])("warns on a contractor %s, since the contract may still run", (_label, contractor) => {
    const result = judgeMaintenance(
      { maintenance: { type: "contract", contractors: [contractor] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("warn");
    expect(result.message).toContain("unknown whether the contract still runs");
  });

  it("warns when an ended contract sits next to one without an end date", () => {
    const result = judgeMaintenance(
      { maintenance: { type: "contract", contractors: [{ name: "Acme", until: "2024-12-31" }, { name: "Beta" }] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("warn");
  });

  it("warns on a contract without contractors", () => {
    expect(judgeMaintenance({ maintenance: { type: "contract" } }, "publiccode.yml", TODAY).status).toBe("warn");
  });

  it.each(["internal", "community"])("passes on %s maintenance with a contact", (type) => {
    const result = judgeMaintenance(
      { maintenance: { type, contacts: [{ name: "Jane Doe", email: "jane@example.org" }] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.status).toBe("pass");
    expect(result.evidence).toEqual(["Jane Doe"]);
  });

  it("ends the message with one full stop when a contact's name ends with one", () => {
    const result = judgeMaintenance(
      { maintenance: { type: "community", contacts: [{ name: "Example B.V." }] } },
      "publiccode.yml",
      TODAY
    );

    expect(result.message).toBe("Maintained (community) by Example B.V.");
  });

  it("warns on internal maintenance without a contact", () => {
    expect(judgeMaintenance({ maintenance: { type: "internal", contacts: [] } }, "publiccode.yml", TODAY).status).toBe(
      "warn"
    );
  });

  it.each([
    ["no maintenance section", { name: "App" }],
    ["no type", { maintenance: {} }],
    ["an unknown type", { maintenance: { type: "sometimes" } }],
    ["an empty file", null],
  ])("warns on %s", (_label, publiccode) => {
    expect(judgeMaintenance(publiccode, "publiccode.yml", TODAY).status).toBe("warn");
  });
});

describe("checkMaintenance", () => {
  const today = new Date(`${TODAY}T12:00:00Z`);

  it("reads maintenance from publiccode.yml, with until parsed as a YAML date", async () => {
    const yaml = "publiccodeYmlVersion: '0.4'\nmaintenance:\n  type: contract\n  contractors:\n    - name: Acme\n      until: 2025-01-31\n";

    const result = await checkMaintenance(contextWith(yaml), ["README.md", "publiccode.yml"], today);

    expect(result.status).toBe("fail");
    expect(result.message).toBe("The maintenance contract ended on 2025-01-31.");
  });

  it("warns without a publiccode.yml", async () => {
    const result = await checkMaintenance(contextWith(null), ["README.md"], today);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("No publiccode.yml");
  });

  it("warns on invalid YAML", async () => {
    const result = await checkMaintenance(contextWith("maintenance: [unclosed"), ["publiccode.yml"], today);

    expect(result.status).toBe("warn");
    expect(result.message).toContain("not valid YAML");
  });
});
