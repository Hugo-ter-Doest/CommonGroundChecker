import { getFileContent } from "../github";
import type { CheckResult } from "../types";

/**
 * Common Ground 5-layer model:
 * 1. Interaction  – Frontend / portals / apps
 * 2. Process      – Orchestration / BFF / process services
 * 3. Integration  – API gateways, NLX, ZGW-brug
 * 4. Service      – Back-end microservices exposing APIs
 * 5. Data         – Data stores / registers
 *
 * We look for signals in folder names, README, topics and package names.
 */

const LAYER_SIGNALS: Record<string, { keywords: string[]; label: string }> = {
  interaction: {
    label: "Interaction layer (frontend / portal)",
    keywords: [
      "frontend",
      "portal",
      "ui",
      "interface",
      "react",
      "vue",
      "angular",
      "next",
      "nuxt",
    ],
  },
  process: {
    label: "Process layer (orchestration / BFF)",
    keywords: [
      "process",
      "orchestration",
      "bff",
      "camunda",
      "flowable",
      "workflow",
      "bpmn",
    ],
  },
  integration: {
    label: "Integration layer (gateway / NLX)",
    keywords: [
      "integration",
      "gateway",
      "nlx",
      "zgw",
      "zaak",
      "api-gateway",
      "proxy",
      "connector",
    ],
  },
  service: {
    label: "Service layer (back-end microservice)",
    keywords: [
      "service",
      "api",
      "backend",
      "microservice",
      "rest",
      "graphql",
      "grpc",
    ],
  },
  data: {
    label: "Data layer (data store / register)",
    keywords: [
      "database",
      "register",
      "data",
      "storage",
      "persistence",
      "postgres",
      "mysql",
      "mongodb",
      "redis",
    ],
  },
};

function detectLayers(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(LAYER_SIGNALS)
    .filter(([, { keywords }]) => keywords.some((k) => lower.includes(k)))
    .map(([, { label }]) => label);
}

export async function checkFiveLayer(
  owner: string,
  repo: string,
  tree: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoMeta: any
): Promise<CheckResult> {
  const treeText = tree.join("\n");
  const topics: string[] = repoMeta?.topics ?? [];
  const repoDescription: string = repoMeta?.description ?? "";

  // Try to read README
  const readmePath = tree.find((p) =>
    ["readme.md", "readme.txt", "readme.rst", "readme"].includes(
      p.toLowerCase()
    )
  );
  const readme = readmePath ? await getFileContent(owner, repo, readmePath) : "";

  const combined = [treeText, topics.join(" "), repoDescription, readme ?? ""].join(
    " "
  );

  const detectedLayers = detectLayers(combined);

  // Extra: check for explicit Common Ground mentions
  const mentionsCG =
    combined.toLowerCase().includes("common ground") ||
    combined.toLowerCase().includes("commonground") ||
    combined.toLowerCase().includes("5-lagen") ||
    combined.toLowerCase().includes("vijf lagen") ||
    combined.toLowerCase().includes("layered architecture");

  if (detectedLayers.length === 0) {
    return {
      id: "fivelayer",
      title: "Common Ground 5-Layer Architecture",
      description:
        "The component should clearly belong to one of the five Common Ground architectural layers.",
      status: "warn",
      message:
        "Could not determine the architectural layer from the repository structure, README, or topics. " +
        "Add relevant keywords or a description to clarify which layer this component targets.",
      evidence: [],
      referenceUrl:
        "https://commonground.nl/cms/view/54476261/5-lagen-model",
    };
  }

  return {
    id: "fivelayer",
    title: "Common Ground 5-Layer Architecture",
    description:
      "The component should clearly belong to one of the five Common Ground architectural layers.",
    status: mentionsCG || detectedLayers.length === 1 ? "pass" : "warn",
    message:
      `Detected layer signals: ${detectedLayers.join("; ")}` +
      (mentionsCG ? " — the repository also explicitly references Common Ground." : ""),
    evidence: detectedLayers,
    referenceUrl:
      "https://commonground.nl/cms/view/54476261/5-lagen-model",
  };
}
