/**
 * Prisma resolves `prisma` + `@prisma/client` from the schema directory (`repo/prisma/`),
 * walking up to `repo/node_modules` — not `repo/apps/api/node_modules`.
 * When you only `npm install` under apps/api, generate fails unless those packages exist at the repo root.
 *
 * This script symlinks the API's installed packages into `<repoRoot>/node_modules/` (no root npm install).
 */
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "..");
const repoRoot = path.join(apiDir, "..", "..");
const apiNm = path.join(apiDir, "node_modules");
const rootNm = path.join(repoRoot, "node_modules");

const links = [
  { src: path.join(apiNm, "prisma"), dest: path.join(rootNm, "prisma") },
  { src: path.join(apiNm, "@prisma", "client"), dest: path.join(rootNm, "@prisma", "client") },
];

function ensureSymlink(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`[@synthr/api] Missing ${src}. Run npm install in apps/api first.`);
    process.exit(1);
  }
  if (fs.existsSync(dest)) {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink() || stat.isDirectory()) return;
    console.error(`[@synthr/api] Refusing to replace non-symlink: ${dest}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (process.platform === "win32") {
    fs.symlinkSync(path.resolve(src), dest, "junction");
    console.log(`[@synthr/api] Linked ${path.relative(repoRoot, dest)} (junction)`);
  } else {
    const rel = path.relative(path.dirname(dest), src);
    fs.symlinkSync(rel, dest, "dir");
    console.log(`[@synthr/api] Linked ${path.relative(repoRoot, dest)} -> ${rel}`);
  }
}

for (const { src, dest } of links) {
  if (!fs.existsSync(dest)) {
    try {
      ensureSymlink(src, dest);
    } catch (e) {
      if (e && e.code === "EEXIST") continue;
      throw e;
    }
  }
}
