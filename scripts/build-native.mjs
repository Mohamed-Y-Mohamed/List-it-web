#!/usr/bin/env node
// scripts/build-native.mjs
// Produces the static bundle that Capacitor ships inside the Android app.
//
// `output: "export"` refuses to build anything that needs a Node server at
// request time, and Next.js offers no way to exclude a route from a build. The
// server-only parts of this app — the /api/* route handlers, the OAuth/email
// callback, and the auth middleware — live on the hosted site and are reached
// over the network by the native app, so they have no place in the bundle.
//
// The same applies to /List/[listId]: a static export can only serve paths that
// existed at build time, and list ids are per-user, so there is nothing to
// prerender. The native app opens /List?id=<id> instead, which is one real page.
//
// So they are moved aside for the duration of the export and moved straight back
// afterwards. The restore runs in a `finally` and also on SIGINT, and a stash
// left behind by a hard kill is recovered on the next run, so a failed build
// never leaves the working tree short of its API routes.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stashRoot = path.join(projectRoot, ".native-build-stash");

// Paths excluded from the native bundle, relative to the project root.
const WEB_ONLY_PATHS = [
  "src/app/api",
  "src/app/auth",
  "src/middleware.ts",
  "src/app/(secure)/List/[listId]",
];

function stashPathFor(relPath) {
  return path.join(stashRoot, relPath.replace(/[\\/]/g, "__"));
}

function moveIfExists(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  return true;
}

function stash() {
  fs.mkdirSync(stashRoot, { recursive: true });
  const moved = [];
  for (const relPath of WEB_ONLY_PATHS) {
    if (moveIfExists(path.join(projectRoot, relPath), stashPathFor(relPath))) {
      moved.push(relPath);
    }
  }
  return moved;
}

function restore() {
  if (!fs.existsSync(stashRoot)) return [];
  const restored = [];
  for (const relPath of WEB_ONLY_PATHS) {
    if (moveIfExists(stashPathFor(relPath), path.join(projectRoot, relPath))) {
      restored.push(relPath);
    }
  }
  fs.rmSync(stashRoot, { recursive: true, force: true });
  return restored;
}

// A previous run may have been killed before it could restore. Put things back
// before touching anything else.
const recovered = restore();
if (recovered.length > 0) {
  console.log(`recovered from a previous interrupted build: ${recovered.join(", ")}`);
}

let interrupted = false;
const onSignal = () => {
  if (interrupted) return;
  interrupted = true;
  console.log("\ninterrupted — restoring server-only routes");
  restore();
  process.exit(130);
};
process.on("SIGINT", onSignal);
process.on("SIGTERM", onSignal);

let exitCode = 0;
try {
  const moved = stash();
  console.log(`excluded from the native bundle: ${moved.join(", ")}`);

  execFileSync("npx", ["next", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      BUILD_TARGET: "native",
      // Inlined into the client bundle as a compile-time constant; see
      // IS_NATIVE_BUILD in src/lib/platform.ts.
      NEXT_PUBLIC_BUILD_TARGET: "native",
    },
  });
} catch (err) {
  exitCode = typeof err.status === "number" ? err.status : 1;
  console.error(`\nnative build failed (exit ${exitCode})`);
} finally {
  if (!interrupted) {
    const restored = restore();
    console.log(`restored: ${restored.join(", ")}`);
  }
}

process.exit(exitCode);
