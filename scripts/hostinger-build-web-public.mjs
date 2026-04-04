import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const webPublicDir = resolve(repoRoot, "apps", "web-public");
const appNextDir = resolve(webPublicDir, ".next");
const rootNextDir = resolve(repoRoot, ".next");
const appPublicDir = resolve(webPublicDir, "public");
const rootPublicDir = resolve(repoRoot, "public");

execSync("npm install", { cwd: webPublicDir, stdio: "inherit" });
execSync("npm run build", { cwd: webPublicDir, stdio: "inherit" });

if (!existsSync(appNextDir)) {
  throw new Error("apps/web-public/.next was not generated.");
}

if (existsSync(rootNextDir)) {
  rmSync(rootNextDir, { recursive: true, force: true });
}

cpSync(appNextDir, rootNextDir, { recursive: true });
if (existsSync(rootPublicDir)) {
  rmSync(rootPublicDir, { recursive: true, force: true });
}
cpSync(appPublicDir, rootPublicDir, { recursive: true });
console.log("Synchronized apps/web-public/.next to root .next for Hostinger output.");
