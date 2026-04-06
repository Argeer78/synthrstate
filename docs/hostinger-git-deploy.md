# Hostinger Git Deploy (No ZIP per change)

This project can run directly from git-deployed source on Hostinger Passenger.

## Prerequisites

- Node.js app root points to this repository root.
- `.htaccess` has:
  - `PassengerAppRoot /home/u639874082/domains/synthrstate.com/nodejs`
  - `PassengerStartupFile server.js`

## How it works

- `server.js` starts Next using `apps/web-public` as the app directory.
- On each restart, `server.js` runs `next build --webpack` in `apps/web-public` unless `SYNTHR_AUTO_BUILD=0`.
- This means git changes in `apps/web-public` go live after deploy + restart, without creating a new zip.

## Deploy steps

1. Push to `main`.
2. Pull/deploy latest git changes to Hostinger `nodejs` root.
3. Trigger Passenger restart by updating `tmp/restart.txt`.
4. Wait for build/startup to complete.
5. Purge Cloudflare cache when needed.

## Verification

- Check `console.log` / `stderr.log` in Node.js root after restart.
- Open `/build-id` and target pages.

## Notes

- First restart after each deploy may take longer due to build.
- If build fails and no previous build exists, app exits (see logs).
- If build fails but previous `.next` exists, server falls back to previous build and logs a warning.
