const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileName = document.getElementById('fileName');
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');
const backBtn = document.getElementById('backBtn');
const pathDisplay = document.getElementById('pathDisplay');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressSize = document.getElementById('progressSize');

let selectedFile = null;
let currentPath = '/';

const params = new URLSearchParams(window.location.search);
if (params.get('path')) {
  currentPath = params.get('path');
}

function navigateTo(newPath) {
  currentPath = newPath;
  const url = new URL(window.location);
  if (newPath === '/') {
    url.searchParams.delete('path');
  } else {
    url.searchParams.set('path', newPath);
  }
  window.history.pushState({}, '', url);
  loadFiles();
}

selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    fileName.textContent = selectedFile.name;
    uploadBtn.disabled = false;
  }
});

uploadBtn.addEventListener('click', uploadFile);
refreshBtn.addEventListener('click', () => loadFiles());

backBtn.addEventListener('click', () => {
  const parent = currentPath === '/' ? '/' : currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
  navigateTo(parent);
});

function qs() {
  return currentPath === '/' ? '' : '?path=' + encodeURIComponent(currentPath);
}

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

  xhr.open('POST', '/upload' + qs());
  xhr.send(formData);

  uploadBtn.disabled = true;
}

function loadFiles() {
  backBtn.style.display = currentPath === '/' ? 'none' : 'inline-block';

  pathDisplay.textContent = currentPath === '/' ? '/ (Ana Dizin)' : currentPath;

  fetch('/files' + qs())
    .then(res => res.json())
    .then(files => {
      if (files.length === 0) {
        filesList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📂</div>
            <p>Bu dizin boş</p>
          </div>
        `;
        return;
      }

      filesList.innerHTML = files.map(file => `
        <div class="file-item">
          <div class="file-info${file.isDirectory ? ' clickable' : ''}" ${file.isDirectory ? `onclick="navigateTo('${currentPath === '/' ? '' : currentPath}/${file.name}')"` : ''}>
            <div class="file-name">${file.isDirectory ? '📁' : '📄'} ${file.name}</div>
            <div class="file-meta">${file.isDirectory ? 'Klasör' : formatFileSize(file.size)} - ${formatDate(file.modified)}</div>
          </div>
          <div class="file-actions">
            ${file.isDirectory ? `
            <button class="btn btn-warning" onclick="event.stopPropagation(); renameFile('${file.name}')">✏️ Yeniden Adlandır</button>
            <button class="btn btn-danger" onclick="event.stopPropagation(); deleteFile('${file.name}')">🗑️ Sil</button>
            ` : `
            ${isViewable(file.name) ? `<button class="btn btn-view" onclick="viewFile('${file.name}')">👁️ Gör</button>` : ''}
            <button class="btn btn-info" onclick="downloadFile('${file.name}')">⬇️ İndir</button>
            <button class="btn btn-warning" onclick="renameFile('${file.name}')">✏️ Yeniden Adlandır</button>
            <button class="btn btn-danger" onclick="deleteFile('${file.name}')">🗑️ Sil</button>
            `}
          </div>
        </div>
      `).join('');
    })
    .catch(() => alert('Dosyalar yüklenemedi!'));
}

const viewableExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'pdf', 'mp3', 'wav'];

function isViewable(name) {
  const ext = name.split('.').pop().toLowerCase();
  return viewableExts.includes(ext);
}

function viewFile(filename) {
  window.open('/view/' + encodeURIComponent(filename) + qs(), '_blank');
}

function downloadFile(filename) {
  window.location.href = '/download/' + encodeURIComponent(filename) + qs();
}

function deleteFile(filename) {
  if (!confirm(`"${filename}" silinsin mi?`)) return;

  fetch('/delete/' + encodeURIComponent(filename) + qs(), { method: 'DELETE' })
    .then(res => res.json())
    .then(() => loadFiles())
    .catch(() => alert('Silinemedi!'));
}

function renameFile(filename) {
  const newname = prompt('Yeni ad:', filename);
  if (!newname || newname === filename) return;

  fetch('/rename/' + encodeURIComponent(filename) + qs(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newname })
  })
    .then(res => res.json())
    .then(() => loadFiles())
    .catch(() => alert('Yeniden adlandırılamadı!'));
}

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  currentPath = params.get('path') || '/';
  loadFiles();
});

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
