const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.argv[2] || 3000;
const uploadDir = process.cwd();

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

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Dosya yüklenmedi" });
  }
  res.json({
    success: true,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
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

app.delete("/delete/:filename", (req, res) => {
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

app.put("/rename/:filename", (req, res) => {
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

app.listen(port, () => {
  console.log(`\n🚀 Dosya Yöneticisi başlatıldı!`);
  console.log(`📂 Dosya dizini: ${uploadDir}`);
  console.log(`🌐 Web arayüzü: http://localhost:${port}`);
  console.log(`\nKapatmak için Ctrl+C\n`);
});
