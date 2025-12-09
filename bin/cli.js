#!/usr/bin/env node
const path = require("path");
const { spawn } = require("child_process");

const serverPath = path.join(__dirname, "..", "index.js");
const port = process.argv[2] || 3000;

const server = spawn("node", [serverPath, port], {
  stdio: "inherit",
  cwd: process.cwd(),
});

server.on("error", (err) => {
  console.error("Server başlatılamadı:", err);
  process.exit(1);
});
