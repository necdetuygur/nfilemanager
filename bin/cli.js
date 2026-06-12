#!/usr/bin/env node
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
nFileManager - Web tabanlı dosya yönetim aracı

Kullanım:
  nfilemanager [options]

Seçenekler:
  --port <number>   Port numarası (varsayılan: 3000)
  --host <string>   Host adresi (varsayılan: 0.0.0.0)
  --root <path>     Kök dizin (varsayılan: geçerli dizin)
  --path <path>     --root ile aynı
  --help            Bu yardım mesajını göster

Örnekler:
  nfilemanager --port 8080
  nfilemanager --port 4321 --host 0.0.0.0 --path /foo/bar
`);
  process.exit(0);
}

const serverPath = path.join(__dirname, "..", "index.js");

const server = spawn("node", [serverPath, ...args], {
  stdio: "inherit",
  cwd: process.cwd(),
});

server.on("error", (err) => {
  console.error("Server başlatılamadı:", err);
  process.exit(1);
});
