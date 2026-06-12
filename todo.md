# nFileManager Geliştirme Todo Listesi

## Aşamalar

### ✅ Step 1 — todo.md oluştur
- [x] Bu dosya oluşturuldu
- [x] Commit & Push

### 🔲 Step 2 — `languages.json` (i18n)
- [ ] Tüm UI string'leri Türkçe ve İngilizce olarak yaz
- [ ] Commit & Push

### 🔲 Step 3 — Backend API'leri (`index.js`)
- [ ] `POST /mkdir` — klasör oluştur
- [ ] `POST /touch` — boş dosya oluştur
- [ ] `POST /copy` — toplu kopyala
- [ ] `POST /move` — toplu taşı
- [ ] `POST /bulk-delete` — toplu sil
- [ ] `GET /read/:filename` — dosya içeriğini oku
- [ ] `POST /save/:filename` — dosya içeriğini yaz
- [ ] Commit & Push

### 🔲 Step 4 — Editör Sayfası (`editor.html` + `editor.js`)
- [ ] `editor.html` sayfası oluştur (textarea, header, save/cancel butonları)
- [ ] `editor.js` mantığı (read, save, back)
- [ ] Tüm stringler `__t()` ile i18n destekli
- [ ] Commit & Push

### 🔲 Step 5 — `index.html` Yapısal Güncelleme
- [ ] Dil seçici dropdown (sağ üst)
- [ ] Breadcrumb alanı
- [ ] Search + Select All row'u
- [ ] Sticky Toolbar (10 buton)
- [ ] Sort header (Name, Size, Type, Date)
- [ ] Empty state (Create File / Create Folder butonları)
- [ ] Editor'a yönlendirme bağlantısı
- [ ] data-i18n attribute'ları
- [ ] Commit & Push

### 🔲 Step 6 — `style.css` Yeni Stiller
- [ ] Breadcrumb stilleri
- [ ] Search box stili
- [ ] Toolbar (sticky, flex-wrap, dark tema)
- [ ] Toolbar butonları (disabled state)
- [ ] Checkbox stilleri (accent-color)
- [ ] File-item grid düzeni
- [ ] Selected row highlight
- [ ] Sort header stilleri
- [ ] Lang-select dropdown
- [ ] Empty state action butonları
- [ ] Responsive (mobile) düzen
- [ ] Commit & Push

### 🔲 Step 7 — `script.js` Mantık Eklemeleri
- [ ] `languages.json` fetch + `__t()` helper
- [ ] `setLocale()` — locale değiştir, UI güncelle
- [ ] Breadcrumb render
- [ ] Search filter (client-side)
- [ ] Sort (name/size/type/date, asc/desc toggle)
- [ ] Checkbox + Select All (Set ile state)
- [ ] `updateToolbar()` — buton enable/disable
- [ ] `createFile()`, `createFolder()` — POST /touch, POST /mkdir
- [ ] `renameSelected()` — PUT /rename
- [ ] `editSelected()` — editor.html'a yönlendir
- [ ] `moveSelected()` — POST /move (prompt ile hedef sor)
- [ ] `copySelected()` — POST /copy (prompt ile hedef sor)
- [ ] `viewSelected()` — window.open /view/
- [ ] `downloadSelected()` — window.location /download/
- [ ] `removeSelected()` — confirm → POST /bulk-delete
- [ ] Empty state tetikleme
- [ ] Eski inline action butonlarını kaldır
- [ ] Commit & Push

### 🔲 Step 8 — Final Kontrol
- [ ] Tüm özellikler çalışıyor mu kontrol et
- [ ] Responsive görünüm testi
- [ ] Dil geçişi testi
- [ ] Bulk delete confirm testi
- [ ] Son commit & push
