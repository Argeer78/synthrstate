/**
 * After `next build` in apps/web-public, Next writes to apps/web-public/.next.
 * Hostinger Passenger deploy runs from a separate Node app root.
 * Copy the build output into the Passenger app root so the live site updates.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "apps", "web-public", ".next");

// Default for local builds / generic hosts.
const defaultDest = path.join(root, ".next");

// Hostinger Passenger app root (your synthrstate.com setup).
// Override via env if needed.
const passengerAppRoot =
  process.env.SYNTHR_WEB_PUBLIC_PASSENGER_ROOT || "/home/u639874082/domains/synthrstate.com/nodejs";
const passengerDest = path.join(passengerAppRoot, ".next");
const passengerRestartFile = path.join(passengerAppRoot, "tmp", "restart.txt");

const usePassenger = process.env.SYNTHR_WEB_PUBLIC_DEPLOY_TARGET === "passenger" || fs.existsSync(passengerAppRoot);
const dest = usePassenger ? passengerDest : defaultDest;

if (!fs.existsSync(src)) {
  console.error(`Missing build output: ${src}`);
  process.exit(1);
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);

if (usePassenger) {
  try {
    fs.mkdirSync(path.dirname(passengerRestartFile), { recursive: true });
    fs.writeFileSync(passengerRestartFile, `${new Date().toISOString()}\n`, { encoding: "utf8" });
    console.log(`Touched Passenger restart file: ${passengerRestartFile}`);
  } catch (e) {
    console.warn(`Copied build, but failed to touch restart file: ${passengerRestartFile}`);
    console.warn(e);
  }
}
