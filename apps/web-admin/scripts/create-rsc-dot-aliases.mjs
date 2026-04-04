import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "out");

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

function toPosixParts(filePath) {
  return path
    .relative(outDir, filePath)
    .split(path.sep)
    .filter(Boolean);
}

function buildAliasParts(parts) {
  const markerIndex = parts.findIndex((part) => part.startsWith("__next."));
  if (markerIndex < 0) return null;
  if (markerIndex === parts.length - 1) return null;

  const prefix = parts.slice(0, markerIndex);
  const marker = parts[markerIndex];
  const tail = parts.slice(markerIndex + 1);
  const alias = `${marker}.${tail.join(".")}`;

  return [...prefix, alias];
}

async function main() {
  let stat;
  try {
    stat = await fs.stat(outDir);
  } catch {
    console.log("[rsc-alias] Skipped: out/ not found.");
    return;
  }

  if (!stat.isDirectory()) {
    console.log("[rsc-alias] Skipped: out is not a directory.");
    return;
  }

  const files = await walkFiles(outDir);
  let created = 0;

  for (const file of files) {
    if (!file.endsWith(".txt")) continue;

    const parts = toPosixParts(file);
    const aliasParts = buildAliasParts(parts);
    if (!aliasParts) continue;

    const aliasPath = path.join(outDir, ...aliasParts);
    if (aliasPath === file) continue;

    await fs.mkdir(path.dirname(aliasPath), { recursive: true });
    await fs.copyFile(file, aliasPath);
    created += 1;
  }

  console.log(`[rsc-alias] Created/updated ${created} alias files.`);
}

main().catch((error) => {
  console.error("[rsc-alias] Failed:", error);
  process.exitCode = 1;
});
