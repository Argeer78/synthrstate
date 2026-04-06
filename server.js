const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const http = require("http");
const next = require("next");

const host = "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const appDir = path.join(__dirname, "apps", "web-public");
const appBuildDir = path.join(appDir, ".next");

function runBuild() {
  const nextBin = require.resolve("next/dist/bin/next");
  const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
    cwd: appDir,
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

function startServer() {
  const app = next({ dev: false, dir: appDir, hostname: host, port });
  const handle = app.getRequestHandler();

  app
    .prepare()
    .then(() => {
      const server = http.createServer((req, res) => handle(req, res));
      server.listen(port, host, () => {
        console.log("Synthr web-public running on " + host + ":" + port);
      });
    })
    .catch((err) => {
      console.error("Failed to prepare Next app", err);
      process.exit(1);
    });
}

const autoBuildEnabled = process.env.SYNTHR_AUTO_BUILD !== "0";

if (autoBuildEnabled) {
  console.log("Auto-build enabled. Building apps/web-public before start...");
  const ok = runBuild();
  if (!ok) {
    if (!fs.existsSync(appBuildDir)) {
      console.error("Build failed and no previous .next output exists. Exiting.");
      process.exit(1);
    }
    console.warn("Build failed. Falling back to existing apps/web-public/.next output.");
  }
}

startServer();
