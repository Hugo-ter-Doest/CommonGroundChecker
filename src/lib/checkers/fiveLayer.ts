import { getFileContent } from "../github";
import type { CheckResult } from "../types";
import { load as loadYaml } from "js-yaml";

type LayerKey = "interaction" | "process" | "integration" | "service" | "data";

const LAYER_DEFINITIONS: Record<LayerKey, {
  label: string;
  pathKeywords: string[];
  textKeywords: string[];
}> = {
  interaction: {
    label: "Interaction layer (frontend / portal)",
    pathKeywords: ["/frontend/", "/ui/", "/portal/", "/web/", "/client/", "frontend", "ui"],
    textKeywords: [
      "frontend",
      "portal",
      "ui",
      "interface",
      "react",
      "vue",
      "angular",
      "next",
      "nuxt",
      "web app",
      "user interface",
      "dashboard",
    ],
  },
  process: {
    label: "Process layer (orchestration / BFF)",
    pathKeywords: ["/process/", "/workflow/", "/orchestration/", "/bff/", "/saga/"],
    textKeywords: [
      "process",
      "orchestration",
      "bff",
      "camunda",
      "flowable",
      "workflow",
      "bpmn",
      "business process",
      "service bus",
    ],
  },
  integration: {
    label: "Integration layer (gateway / NLX)",
    pathKeywords: ["/integration/", "/gateway/", "/nlx/", "/proxy/", "/api-gateway/"],
    textKeywords: [
      "integration",
      "gateway",
      "nlx",
      "zgw",
      "zaak",
      "api-gateway",
      "proxy",
      "connector",
      "mediator",
    ],
  },
  service: {
    label: "Service layer (back-end microservice)",
    pathKeywords: ["/service/", "/services/", "/backend/", "/api/", "/rest/", "/graphql/", "/grpc/"],
    textKeywords: [
      "service",
      "api",
      "backend",
      "microservice",
      "rest",
      "graphql",
      "grpc",
      "server",
      "api service",
    ],
  },
  data: {
    label: "Data layer (data store / register)",
    pathKeywords: ["/data/", "/db/", "/database/", "/register/", "/storage/"],
    textKeywords: [
      "database",
      "register",
      "data store",
      "register",
      "storage",
      "persistence",
      "postgres",
      "mysql",
      "mongodb",
      "redis",
      "sql",
      "nosql",
    ],
  },
};

const README_FILENAMES = ["readme.md", "readme.txt", "readme.rst", "readme"];
const PUBLICCODE_FILENAMES = ["publiccode.yml", "publiccode.yaml"];

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").toLowerCase();
}

function flattenStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenStrings);
  }
  return [];
}

function detectLayerSignalsFromPath(repoPath: string): Array<{ layer: LayerKey; evidence: string }> {
  const normalized = normalizePath(repoPath);
  const detections: Array<{ layer: LayerKey; evidence: string }> = [];

  for (const [layer, { label, pathKeywords }] of Object.entries(LAYER_DEFINITIONS) as [LayerKey, typeof LAYER_DEFINITIONS[LayerKey]][]) {
    for (const keyword of pathKeywords) {
      if (normalized.includes(keyword)) {
        detections.push({
          layer,
          evidence: `Found path segment "${keyword.replace(/\//g, "")}" in ${repoPath}`,
        });
        break;
      }
    }
  }

  return detections;
}

function detectLayerSignalsFromText(
  text: string,
  source: string
): Array<{ layer: LayerKey; evidence: string }> {
  const lower = text.toLowerCase();
  const detections: Array<{ layer: LayerKey; evidence: string }> = [];

  for (const [layer, { textKeywords }] of Object.entries(LAYER_DEFINITIONS) as [LayerKey, typeof LAYER_DEFINITIONS[LayerKey]][]) {
    for (const keyword of textKeywords) {
      if (lower.includes(keyword)) {
        detections.push({
          layer,
          evidence: `Found "${keyword}" in ${source}`,
        });
        break;
      }
    }
  }

  return detections;
}

async function extractPublicCodeText(owner: string, repo: string, tree: string[]): Promise<string> {
  const publiccodePath = tree.find((path) =>
    PUBLICCODE_FILENAMES.includes(path.toLowerCase())
  );

  if (!publiccodePath) {
    return "";
  }

  const raw = await getFileContent(owner, repo, publiccodePath);
  if (!raw) {
    return "";
  }

  try {
    const parsed = loadYaml(raw);
    return flattenStrings(parsed).join(" ");
  } catch {
    return raw;
  }
}

function formatLayerLabels(layers: LayerKey[]): string[] {
  return layers.map((layer) => LAYER_DEFINITIONS[layer].label);
}

function getLayerConfidence(layers: LayerKey[], evidence: string[]): "high" | "medium" | "low" {
  if (layers.length === 1 && evidence.length > 0) {
    return "high";
  }

  if (layers.length > 1) {
    return "medium";
  }

  return "low";
}

export async function checkFiveLayer(
  owner: string,
  repo: string,
  tree: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoMeta: any
): Promise<CheckResult> {
  const topics: string[] = repoMeta?.topics ?? [];
  const repoDescription: string = repoMeta?.description ?? "";

  const readmePath = tree.find((path) =>
    README_FILENAMES.includes(path.toLowerCase())
  );
  const readme = readmePath ? await getFileContent(owner, repo, readmePath) : "";
  const publiccodeText = await extractPublicCodeText(owner, repo, tree);

  const layerDetections = new Map<LayerKey, string[]>();

  for (const repoPath of tree) {
    for (const detection of detectLayerSignalsFromPath(repoPath)) {
      const existing = layerDetections.get(detection.layer) ?? [];
      layerDetections.set(detection.layer, [...existing, detection.evidence]);
    }
  }

  const combinedText = [topics.join(" "), repoDescription, readme, publiccodeText].join(" ");
  for (const detection of detectLayerSignalsFromText(combinedText, "repository metadata and docs")) {
    const existing = layerDetections.get(detection.layer) ?? [];
    layerDetections.set(detection.layer, [...existing, detection.evidence]);
  }

  const detectedLayers = Array.from(layerDetections.keys());
  const evidence = Array.from(layerDetections.values()).flat();
  const mentionsCG = /common\s*ground|commonground|5-lagen|vijf\s+lagen|layered architecture/i.test(
    combinedText
  );

  if (detectedLayers.length === 0) {
    return {
      id: "fivelayer",
      title: "Common Ground 5-Layer Architecture",
      description:
        "The component should clearly belong to one of the five Common Ground architectural layers.",
      status: "warn",
      message:
        "Could not determine the architectural layer from the repository structure, metadata, or documentation. " +
        "Add a clear layer signal or split the repository into a single Common Ground layer.",
      evidence: mentionsCG ? ["Repository references Common Ground, but no layer signal was detected."] : [],
      referenceUrl:
        "https://commonground.nl/cms/view/54476261/5-lagen-model",
      confidence: "low",
    };
  }

  const labels = formatLayerLabels(detectedLayers);
  const status = detectedLayers.length === 1 ? "pass" : "warn";
  const messageParts = [
    `Detected layer signals: ${labels.join("; ")}.`,
    detectedLayers.length > 1
      ? "This repository appears to span multiple Common Ground layers. Consider splitting responsibilities or clarifying the primary layer."
      : "This repository appears to target a single Common Ground layer.",
  ];

  if (mentionsCG) {
    messageParts.push("The repository also references Common Ground.");
  }

  return {
    id: "fivelayer",
    title: "Common Ground 5-Layer Architecture",
    description:
      "The component should clearly belong to one of the five Common Ground architectural layers.",
    status,
    message: messageParts.join(" "),
    evidence,
    referenceUrl:
      "https://commonground.nl/cms/view/54476261/5-lagen-model",
    confidence: getLayerConfidence(detectedLayers, evidence),
  };
}
