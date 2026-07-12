#!/usr/bin/env node
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
nFileManager - Web-based file management tool

Usage:
  nfilemanager [options]

Options:
  --port <number>   Port number (default: 3000)
  --host <string>   Host address (default: 0.0.0.0)
  --root <path>     Root directory (default: current directory)
  --path <path>     Same as --root
  --readonly        Enable readonly mode (also: --ro, -r, -ro)
  --help            Show this help message

Environment:
  NFILEMANAGER_READONLY=true   Enable readonly mode via env (overridden by CLI)

Examples:
  nfilemanager --port 8080
  nfilemanager --readonly
  nfilemanager --port 4321 --host 0.0.0.0 --path /foo/bar --ro
`);
  process.exit(0);
}

const serverPath = path.join(__dirname, "..", "index.js");

const server = spawn("node", [serverPath, ...args], {
  stdio: "inherit",
  cwd: process.cwd(),
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
