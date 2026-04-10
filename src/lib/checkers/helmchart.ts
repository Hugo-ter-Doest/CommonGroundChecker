import { getFileContent, getRepoTree, parseGitHubTreeUrl } from "../github";
import type { CheckResult } from "../types";

/**
 * Haven is the Dutch Kubernetes certification for municipalities.
 * We check for:
 * - Helm chart (Chart.yaml)
 * - Kubernetes manifests
 * - Resource requests/limits
 * - Liveness & readiness probes
 * - Security context / non-root
 * - NetworkPolicy
 */

export async function checkHelmChart(
  owner: string,
  repo: string,
  tree: string[],
  helmChartLocations: string[] = []
): Promise<CheckResult> {
  const lowerTree = tree.map((p) => p.toLowerCase());
  const normalizedHints = helmChartLocations.map((p) => p.toLowerCase());
  const localPathHints = normalizedHints.filter(
    (h) => !h.startsWith("http://") && !h.startsWith("https://")
  );

  const externalTreeHints = helmChartLocations
    .map((h) => parseGitHubTreeUrl(h))
    .filter(
      (
        h
      ): h is {
        owner: string;
        repo: string;
        branch: string;
        path: string;
      } => !!h
    );

  const externalChartEvidence: string[] = [];
  let externalHelmDetected = false;

  if (externalTreeHints.length > 0) {
    const uniqueTargets = new Map<string, string[]>();
    for (const hint of externalTreeHints) {
      const key = `${hint.owner}/${hint.repo}@${hint.branch}`;
      uniqueTargets.set(key, [...(uniqueTargets.get(key) ?? []), hint.path]);
    }

    for (const [target, paths] of uniqueTargets.entries()) {
      const [repoPart, branch] = target.split("@");
      const [targetOwner, targetRepo] = repoPart.split("/");
      try {
        const externalTree = await getRepoTree(targetOwner, targetRepo, branch);
        const externalLower = externalTree.map((p) => p.toLowerCase());

        for (const rawPath of paths) {
          const normalizedPath = rawPath.toLowerCase().replace(/^\/+|\/+$/g, "");
          const expectedChart = normalizedPath.endsWith("chart.yaml")
            ? normalizedPath
            : `${normalizedPath}/chart.yaml`;

          if (externalLower.includes(expectedChart)) {
            externalHelmDetected = true;
            externalChartEvidence.push(
              `External helm chart detected: https://github.com/${targetOwner}/${targetRepo}/tree/${branch}/${rawPath}`
            );
          }
        }
      } catch {
        // Ignore external lookup errors and continue with local repo checks.
      }
    }
  }

  // --- Helm chart ---
  const hintedHelmChart = tree.find((p) => {
    const lower = p.toLowerCase();
    return (
      lower.endsWith("chart.yaml") &&
      localPathHints.some((hint) => lower.startsWith(hint + "/") || lower === `${hint}/chart.yaml`)
    );
  });
  const autoDetectedHelmChart = tree.find((p) => p.toLowerCase().endsWith("chart.yaml"));
  const helmChart = hintedHelmChart ?? autoDetectedHelmChart;
  const hasHelm = !!helmChart || externalHelmDetected;

  // --- Kubernetes manifests ---
  const k8sFiles = tree.filter((p) => {
    const lower = p.toLowerCase();
    const isInHintedPath = localPathHints.some(
      (hint) => lower === hint || lower.startsWith(hint + "/")
    );
    return (
      isInHintedPath ||
      lower.includes("k8s/") ||
      lower.includes("kubernetes/") ||
      lower.includes("deploy/") ||
      lower.includes("chart/templates/") ||
      lower.includes("helm/") ||
      (lower.endsWith(".yaml") && lower.includes("manifest"))
    );
  });

  const evidence: string[] = [];
  if (helmChart) evidence.push(helmChart);
  if (helmChartLocations.length > 0) {
    evidence.push(`Provided helm locations: ${helmChartLocations.join(", ")}`);
  }
  evidence.push(...externalChartEvidence);
  evidence.push(...k8sFiles.slice(0, 5));

  if (!hasHelm && k8sFiles.length === 0) {
    return {
      id: "helmchart",
      title: "Helm chart (Kubernetes)",
      description:
        "Haven-compliant components must be deployable on Kubernetes, ideally with a Helm chart.",
      status: "fail",
      message:
        "No Helm chart (Chart.yaml) or Kubernetes manifests found. " +
        "Haven requires components to be deployable on a certified Kubernetes cluster.",
      evidence: [],
      referenceUrl: "https://haven.commonground.nl",
    };
  }

  // --- Deeper inspection of Helm templates / deployment manifests ---
  const yamlFiles = tree.filter(
    (p) =>
      p.toLowerCase().endsWith(".yaml") || p.toLowerCase().endsWith(".yml")
  );

  const recentK8sYamls = yamlFiles
    .filter(
      (p) =>
        localPathHints.some((hint) => p.toLowerCase() === hint || p.toLowerCase().startsWith(hint + "/")) ||
        p.toLowerCase().includes("deployment") ||
        p.toLowerCase().includes("template") ||
        p.toLowerCase().includes("k8s") ||
        p.toLowerCase().includes("kubernetes")
    )
    .slice(0, 3);

  const contents = await Promise.all(
    recentK8sYamls.map((f) => getFileContent(owner, repo, f).then((c) => c ?? ""))
  );
  const combined = contents.join("\n").toLowerCase();

  const signals = {
    resourceLimits:
      combined.includes("resources:") && combined.includes("limits:"),
    liveness: combined.includes("livenessprobe:"),
    readiness: combined.includes("readinessprobe:"),
    securityContext:
      combined.includes("securitycontext:") ||
      combined.includes("runasnonroot:"),
    networkPolicy: lowerTree.some(
      (p) => p.includes("networkpolic") || combined.includes("networkpolicy")
    ),
  };

  const passedSignals = Object.values(signals).filter(Boolean).length;
  const signalLabels = {
    resourceLimits: "Resource limits/requests",
    liveness: "Liveness probe",
    readiness: "Readiness probe",
    securityContext: "Security context / non-root",
    networkPolicy: "NetworkPolicy",
  };

  const passed = Object.entries(signals)
    .filter(([, v]) => v)
    .map(([k]) => signalLabels[k as keyof typeof signalLabels]);
  const missing = Object.entries(signals)
    .filter(([, v]) => !v)
    .map(([k]) => signalLabels[k as keyof typeof signalLabels]);

  if (passedSignals >= 3) {
    return {
      id: "helmchart",
      title: "Helm chart (Kubernetes)",
      description:
        "Haven-compliant components must be deployable on Kubernetes with proper security and reliability settings.",
      status: "pass",
      message: `Helm chart and Kubernetes manifests present. Good practices found: ${passed.join(", ")}.${missing.length > 0 ? ` Consider adding: ${missing.join(", ")}.` : ""}`,
      evidence,
      referenceUrl: "https://haven.commonground.nl",
    };
  }

  return {
    id: "helmchart",
    title: "Helm chart (Kubernetes)",
    description:
      "Haven-compliant components must be deployable on Kubernetes with proper security and reliability settings.",
    status: "warn",
    message:
      `${hasHelm ? "Helm chart" : "Kubernetes manifests"} found.` +
      (externalHelmDetected ? " Helm chart confirmed via provided GitHub chart URL." : "") +
      (passed.length > 0 ? ` Good practices found: ${passed.join(", ")}.` : "") +
      (missing.length > 0 ? ` Missing or not detected: ${missing.join(", ")}.` : ""),
    evidence,
    referenceUrl: "https://haven.commonground.nl",
  };
}
