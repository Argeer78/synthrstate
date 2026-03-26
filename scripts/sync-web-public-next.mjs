/**
 * After `next build` in apps/web-public, Next writes to apps/web-public/.next.
 * Hostinger (root directory ./) expects ./.next — copy the folder to the repo root.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "apps", "web-public", ".next");
const dest = path.join(root, ".next");

if (!fs.existsSync(src)) {
  console.error(`Missing build output: ${src}`);
  process.exit(1);
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
