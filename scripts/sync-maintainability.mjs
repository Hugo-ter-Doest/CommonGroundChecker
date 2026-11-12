// Refreshes the vendored maintainability script from its upstream repository.
// Usage: node scripts/sync-maintainability.mjs [commit-sha]
import { writeFile } from "node:fs/promises";
import path from "node:path";

const UPSTREAM_REPO = "ConductionNL/.github";
const UPSTREAM_PATH = "hydra-gates/scripts/lib/check_sig_maintainability.py";
const targetDir = path.join(process.cwd(), "scripts", "maintainability");

async function resolveSha(ref) {
  const response = await fetch(`https://api.github.com/repos/${UPSTREAM_REPO}/commits/${ref}`, {
    headers: { Accept: "application/vnd.github.sha" },
  });
  if (!response.ok) throw new Error(`Could not resolve ${ref}: HTTP ${response.status}`);
  return (await response.text()).trim();
}

const sha = await resolveSha(process.argv[2] ?? "main");
const response = await fetch(`https://raw.githubusercontent.com/${UPSTREAM_REPO}/${sha}/${UPSTREAM_PATH}`);
if (!response.ok) throw new Error(`Could not download the script at ${sha}: HTTP ${response.status}`);

await writeFile(path.join(targetDir, "check_maintainability.py"), await response.text());
await writeFile(path.join(targetDir, "UPSTREAM"), `${sha}\n`);
console.log(`Vendored ${UPSTREAM_PATH} at ${sha}`);
