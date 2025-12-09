const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.argv[2] || 3000;
const uploadDir = path.join(process.cwd(), "uploads");

// Upload klasörünü oluştur
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Dosya yükleme
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

// Dosya listesi
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Dosyalar okunamadı" });
    }

    const fileDetails = files.map((file) => {
      const stats = fs.statSync(path.join(uploadDir, file));
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
      };
    });

    res.json(fileDetails);
  });
});

// Dosya indirme
app.get("/download/:filename", (req, res) => {
  const filepath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  res.download(filepath);
});

// Dosya silme
app.delete("/delete/:filename", (req, res) => {
  const filepath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "Dosya bulunamadı" });
  }

  fs.unlink(filepath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Dosya silinemedi" });
    }
    res.json({ success: true });
  });
});

// Dosya yeniden adlandırma
app.put("/rename/:filename", (req, res) => {
  const oldPath = path.join(uploadDir, req.params.filename);
  const newPath = path.join(uploadDir, req.body.newname);

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
