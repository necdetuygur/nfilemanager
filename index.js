const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { port: 3000, host: '0.0.0.0', root: process.cwd(), readonly: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--port=')) opts.port = parseInt(arg.split('=')[1], 10) || opts.port;
    else if (arg === '--port' && args[i + 1] && !args[i + 1].startsWith('--')) opts.port = parseInt(args[++i], 10) || opts.port;
    else if (arg.startsWith('--host=')) opts.host = arg.split('=')[1];
    else if (arg === '--host' && args[i + 1] && !args[i + 1].startsWith('--')) opts.host = args[++i];
    else if (arg.startsWith('--root=')) opts.root = path.resolve(arg.split('=')[1]);
    else if (arg === '--root' && args[i + 1] && !args[i + 1].startsWith('--')) opts.root = path.resolve(args[++i]);
    else if (arg.startsWith('--path=')) opts.root = path.resolve(arg.split('=')[1]);
    else if (arg === '--path' && args[i + 1] && !args[i + 1].startsWith('--')) opts.root = path.resolve(args[++i]);
    else if (['--readonly', '--ro', '-r', '-ro'].includes(arg)) opts.readonly = true;
  }
  if (!opts.readonly && process.env.NFILEMANAGER_READONLY === 'true') {
    opts.readonly = true;
  }
  return opts;
}

const opts = parseArgs();
const app = express();
const port = opts.port;
const host = opts.host;
const uploadDir = opts.root;

function safePath(queryPath) {
  const relative = (queryPath || "/").replace(/^\/+/, "");
  const resolved = path.resolve(uploadDir, relative);
  if (!resolved.startsWith(uploadDir)) return null;
  return resolved;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = safePath(req.query.path);
    if (!dir) return cb(new Error("Geçersiz dizin"));
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const dir = safePath(req.query.path);
    if (!dir) return cb(new Error("Geçersiz dizin"));
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    let newName = file.originalname;
    let counter = 2;
    while (fs.existsSync(path.join(dir, newName))) {
      newName = base + "-" + counter + ext;
      counter++;
    }
    cb(null, newName);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const readonly = opts.readonly;

app.get("/config", (req, res) => {
  res.json({ readonly });
});

function requireWriteAccess(req, res, next) {
  if (readonly) {
    return res.status(403).json({ error: "Readonly mod aktif — yazma işlemleri devre dışı" });
  }
  next();
}

app.post("/upload", requireWriteAccess, upload.array("file", 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Dosya yüklenmedi" });
  }
  res.json({
    success: true,
    files: req.files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
    })),
  });
});

app.get("/files", (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });

  fs.readdir(targetDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Dosyalar okunamadı" });
    }

    const fileDetails = files.map((file) => {
      const fullPath = path.join(targetDir, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    });

    fileDetails.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    res.json(fileDetails);
  });
});

app.get("/download/:filename", (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const filepath = path.join(targetDir, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  res.download(filepath);
});

app.get("/view/:filename", (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const filepath = path.join(targetDir, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  res.sendFile(filepath);
});

app.delete("/delete/:filename", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const filepath = path.join(targetDir, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  const stat = fs.statSync(filepath);
  const removeFn = stat.isDirectory() ? fs.rm : fs.unlink;
  removeFn(filepath, { recursive: true }, (err) => {
    if (err) {
      return res.status(500).json({ error: "Silinemedi" });
    }
    res.json({ success: true });
  });
});

app.put("/rename/:filename", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const oldPath = path.join(targetDir, req.params.filename);
  const newPath = path.join(targetDir, req.body.newname);

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: "Bu isimde dosya zaten var" });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Dosya adı değiştirilemedi" });
    }
    res.json({ success: true, newname: req.body.newname });
  });
});

app.post("/mkdir", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "İsim gerekli" });
  const dirPath = path.join(targetDir, name);
  if (fs.existsSync(dirPath)) return res.status(400).json({ error: "Bu isimde dosya/klasör zaten var" });
  fs.mkdir(dirPath, { recursive: false }, (err) => {
    if (err) return res.status(500).json({ error: "Klasör oluşturulamadı" });
    res.json({ success: true, name });
  });
});

app.post("/touch", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "İsim gerekli" });
  const filePath = path.join(targetDir, name);
  if (fs.existsSync(filePath)) return res.status(400).json({ error: "Bu isimde dosya/klasör zaten var" });
  fs.writeFile(filePath, "", (err) => {
    if (err) return res.status(500).json({ error: "Dosya oluşturulamadı" });
    res.json({ success: true, name });
  });
});

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

app.post("/copy", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const { names, destination } = req.body;
  if (!names || !Array.isArray(names) || names.length === 0) return res.status(400).json({ error: "Dosya listesi gerekli" });
  if (!destination) return res.status(400).json({ error: "Hedef dizin gerekli" });
  const destDir = safePath(destination);
  if (!destDir) return res.status(400).json({ error: "Geçersiz hedef dizin" });
  if (!fs.existsSync(destDir)) return res.status(400).json({ error: "Hedef dizin mevcut değil" });
  const errors = [];
  for (const name of names) {
    const srcPath = path.join(targetDir, name);
    const destPath = path.join(destDir, name);
    if (!fs.existsSync(srcPath)) { errors.push(name); continue; }
    try {
      copyRecursive(srcPath, destPath);
    } catch (e) { errors.push(name); }
  }
  res.json({ success: errors.length === 0, errors });
});

app.post("/move", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const { names, destination } = req.body;
  if (!names || !Array.isArray(names) || names.length === 0) return res.status(400).json({ error: "Dosya listesi gerekli" });
  if (!destination) return res.status(400).json({ error: "Hedef dizin gerekli" });
  const destDir = safePath(destination);
  if (!destDir) return res.status(400).json({ error: "Geçersiz hedef dizin" });
  if (!fs.existsSync(destDir)) return res.status(400).json({ error: "Hedef dizin mevcut değil" });
  const errors = [];
  for (const name of names) {
    const srcPath = path.join(targetDir, name);
    const destPath = path.join(destDir, name);
    if (!fs.existsSync(srcPath)) { errors.push(name); continue; }
    try {
      fs.renameSync(srcPath, destPath);
    } catch (e) { errors.push(name); }
  }
  res.json({ success: errors.length === 0, errors });
});

app.post("/bulk-delete", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const { names } = req.body;
  if (!names || !Array.isArray(names) || names.length === 0) return res.status(400).json({ error: "Dosya listesi gerekli" });
  const errors = [];
  for (const name of names) {
    const filepath = path.join(targetDir, name);
    if (!fs.existsSync(filepath)) { errors.push(name); continue; }
    try {
      const stat = fs.statSync(filepath);
      const removeFn = stat.isDirectory() ? fs.rmSync : fs.unlinkSync;
      removeFn(filepath, { recursive: true });
    } catch (e) { errors.push(name); }
  }
  res.json({ success: errors.length === 0, errors });
});

app.get("/read/:filename", (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const filepath = path.join(targetDir, req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: "Dosya bulunamadı" });
  const stat = fs.statSync(filepath);
  if (stat.isDirectory()) return res.status(400).json({ error: "Klasör okunamaz" });
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ error: "Dosya okunamadı" });
  }
});

app.post("/save/:filename", requireWriteAccess, (req, res) => {
  const targetDir = safePath(req.query.path);
  if (!targetDir) return res.status(400).json({ error: "Geçersiz dizin" });
  const filepath = path.join(targetDir, req.params.filename);
  if (req.body.content === undefined) return res.status(400).json({ error: "İçerik gerekli" });
  try {
    fs.writeFileSync(filepath, String(req.body.content), "utf-8");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Dosya kaydedilemedi" });
  }
});

app.listen(port, host, () => {
  console.log(`\n🚀 nFileManager başlatıldı!`);
  console.log(`📂 Kök dizin: ${uploadDir}`);
  console.log(`🌐 Web arayüzü: http://${host}:${port}`);
  if (readonly) {
    console.log(`🔒 Sadece okuma modu AKTİF — yazma işlemleri engelleniyor`);
  } else {
    console.log(`ℹ️  Sadece okuma modunda başlatmak için: --readonly, --ro, -r veya -ro`);
  }
  console.log(`\nKapatmak için Ctrl+C\n`);
});
