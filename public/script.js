const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileName = document.getElementById('fileName');
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressSize = document.getElementById('progressSize');

let selectedFile = null;

selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    fileName.textContent = selectedFile.name;
    uploadBtn.disabled = false;
  }
});

uploadBtn.addEventListener('click', uploadFile);
refreshBtn.addEventListener('click', loadFiles);

function uploadFile() {
  if (!selectedFile) return;
  
  const formData = new FormData();
  formData.append('file', selectedFile);
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      const loadedMB = (e.loaded / (1024 * 1024)).toFixed(2);
      const totalMB = (e.total / (1024 * 1024)).toFixed(2);
      
      progressContainer.style.display = 'block';
      progressBar.style.width = percent + '%';
      progressPercent.textContent = percent + '%';
      progressSize.textContent = `${loadedMB} MB / ${totalMB} MB`;
    }
  });
  
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        fileInput.value = '';
        fileName.textContent = 'Seçili dosya yok';
        selectedFile = null;
        uploadBtn.disabled = true;
        loadFiles();
      }, 500);
    } else {
      alert('Yükleme başarısız!');
      progressContainer.style.display = 'none';
    }
  });
  
  xhr.addEventListener('error', () => {
    alert('Yükleme hatası!');
    progressContainer.style.display = 'none';
  });
  
  xhr.open('POST', '/upload');
  xhr.send(formData);
  
  uploadBtn.disabled = true;
}

function loadFiles() {
  fetch('/files')
    .then(res => res.json())
    .then(files => {
      if (files.length === 0) {
        filesList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📂</div>
            <p>Henüz dosya yüklenmemiş</p>
          </div>
        `;
        return;
      }
      
      filesList.innerHTML = files.map(file => `
        <div class="file-item">
          <div class="file-info">
            <div class="file-name">📄 ${file.name}</div>
            <div class="file-meta">${formatFileSize(file.size)} - ${formatDate(file.modified)}</div>
          </div>
          <div class="file-actions">
            <button class="btn btn-info" onclick="downloadFile('${file.name}')">⬇️ İndir</button>
            <button class="btn btn-warning" onclick="renameFile('${file.name}')">✏️ Yeniden Adlandır</button>
            <button class="btn btn-danger" onclick="deleteFile('${file.name}')">🗑️ Sil</button>
          </div>
        </div>
      `).join('');
    })
    .catch(() => alert('Dosyalar yüklenemedi!'));
}

function downloadFile(filename) {
  window.location.href = `/download/${filename}`;
}

function deleteFile(filename) {
  if (!confirm(`"${filename}" dosyasını silmek istediğinize emin misiniz?`)) return;
  
  fetch(`/delete/${filename}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => loadFiles())
    .catch(() => alert('Dosya silinemedi!'));
}

function renameFile(filename) {
  const newname = prompt('Yeni dosya adı:', filename);
  if (!newname || newname === filename) return;
  
  fetch(`/rename/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newname })
  })
    .then(res => res.json())
    .then(() => loadFiles())
    .catch(() => alert('Dosya adı değiştirilemedi!'));
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  return new Date(date).toLocaleString('tr-TR');
}

loadFiles();
