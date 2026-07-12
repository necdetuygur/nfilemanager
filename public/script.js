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
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('searchInput');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const langSelect = document.getElementById('langSelect');
const toolbar = document.getElementById('toolbar');

const renameBtn = document.getElementById('renameBtn');
const editBtn = document.getElementById('editBtn');
const moveBtn = document.getElementById('moveBtn');
const copyBtn = document.getElementById('copyBtn');
const viewBtn = document.getElementById('viewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const removeBtn = document.getElementById('removeBtn');

let selectedFiles_upload = [];
let currentPath = '/';
let locale = localStorage.getItem('nfilemanager-locale') || 'tr';
let translations = {};
let selectedFiles = new Set();
let sortBy = 'name';
let sortAsc = true;
let filesData = [];
let READONLY = false;

const viewableExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'pdf', 'mp3', 'wav'];
const editableExts = ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'htm', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml', 'md', 'csv', 'log', 'sh', 'bash', 'zsh', 'conf', 'cfg', 'ini', 'env', 'gitignore', 'dockerfile', 'sql', 'php', 'rb', 'go', 'rs', 'toml', 'lock', 'gradle', 'swift', 'kt', 'java', 'c', 'cpp', 'h', 'hpp', 'vue', 'svelte', 'astro', 'sass', 'less'];

const params = new URLSearchParams(window.location.search);
if (params.get('path')) {
  currentPath = params.get('path');
}
if (params.get('locale')) {
  locale = params.get('locale');
}

function __t(key) {
  return translations[locale]?.[key] || key;
}

function setLocale(lang) {
  locale = lang;
  localStorage.setItem('nfilemanager-locale', lang);
  langSelect.value = lang;
  updateI18nElements();
  updateSortHeader();
  applyReadonlyUI();
  if (filesData.length > 0) renderFiles();
}

function updateI18nElements() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = __t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = __t(key);
  });
}

function updateSortHeader() {
  document.querySelectorAll('.sort-btn').forEach(el => {
    const field = el.getAttribute('data-sort');
    let label = __t(field);
    if (field === sortBy) {
      label += ' ' + __t(sortAsc ? 'asc' : 'desc');
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
    el.textContent = label;
  });
}

function qs() {
  return currentPath === '/' ? '' : '?path=' + encodeURIComponent(currentPath);
}

function navigateTo(newPath) {
  selectedFiles.clear();
  updateToolbar();
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

function renderBreadcrumb() {
  if (currentPath === '/') {
    breadcrumb.innerHTML = `<span class="current">${__t('rootDir')}</span>`;
    return;
  }
  const parts = currentPath.split('/').filter(Boolean);
  let acc = '';
  const items = [{ name: __t('rootDir'), path: '/' }];
  for (const part of parts) {
    acc += '/' + part;
    items.push({ name: part, path: acc });
  }
  breadcrumb.innerHTML = items.map((item, i) => {
    const isLast = i === items.length - 1;
    const sep = i > 0 ? '<span class="separator">›</span>' : '';
    if (isLast) {
      return `${sep}<span class="current">${item.name}</span>`;
    }
    return `${sep}<a onclick="navigateTo('${item.path}')">${item.name}</a>`;
  }).join('');
}

function toggleSelectAll(checked) {
  const filtered = getFilteredFiles();
  if (checked) {
    for (const f of filtered) selectedFiles.add(f.name);
  } else {
    for (const f of filtered) selectedFiles.delete(f.name);
  }
  updateCheckboxes();
  updateToolbar();
}

function toggleFile(name, checked) {
  if (checked) {
    selectedFiles.add(name);
  } else {
    selectedFiles.delete(name);
  }
  selectAllCheckbox.checked = selectedFiles.size === getFilteredFiles().length && getFilteredFiles().length > 0;
  updateToolbar();
}

function updateCheckboxes() {
  document.querySelectorAll('.file-checkbox:not(#selectAllCheckbox)').forEach(cb => {
    cb.checked = selectedFiles.has(cb.dataset.name);
  });
  const filtered = getFilteredFiles();
  selectAllCheckbox.checked = filtered.length > 0 && selectedFiles.size === filtered.length;
}

function getFilteredFiles() {
  const q = searchInput.value.trim().toLowerCase();
  return q ? filesData.filter(f => f.name.toLowerCase().includes(q)) : filesData;
}

function getSortedFiles() {
  const filtered = getFilteredFiles();
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    const dirCmp = (b.isDirectory ? 1 : 0) - (a.isDirectory ? 1 : 0);
    if (dirCmp !== 0) return dirCmp;
    let cmp = 0;
    switch (sortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      case 'size':
        cmp = (a.size || 0) - (b.size || 0);
        break;
      case 'type': {
        const extA = a.isDirectory ? '' : (a.name.split('.').pop() || '');
        const extB = b.isDirectory ? '' : (b.name.split('.').pop() || '');
        cmp = extA.localeCompare(extB);
        if (cmp === 0) cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      }
      case 'date':
        cmp = new Date(a.modified) - new Date(b.modified);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });
  return sorted;
}

function renderFiles() {
  renderBreadcrumb();

  const sorted = getSortedFiles();
  if (currentPath !== '/') {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    sorted.unshift({ name: '..', isDirectory: true, size: 0, modified: new Date().toISOString() });
  }
  selectAllCheckbox.checked = sorted.length > 0 && selectedFiles.size === sorted.length;

  if (sorted.length === 0) {
    filesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <p>${__t('empty')}</p>
        ${READONLY ? '' : `
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="window.createFile()">${__t('createFile')}</button>
          <button class="btn btn-primary" onclick="window.createFolder()">${__t('createFolder')}</button>
        </div>`}
      </div>
    `;
    return;
  }

  filesList.innerHTML = sorted.map(file => {
    const isSelected = selectedFiles.has(file.name);
    const isParent = file.name === '..';
    const fileUrl = (currentPath === '/' ? '' : currentPath) + '/' + file.name;
    const escapedName = file.name.replace(/'/g, "\\'");
    const isDir = file.isDirectory;
    const meta = isDir ? __t('folder') : formatFileSize(file.size);
    const clickHandler = isParent
      ? `window.navigateTo('${currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'}')`
      : isDir ? `window.navigateTo('${fileUrl}')` : `window.viewFile('${escapedName}')`;

    return `
      <div class="file-item${isSelected ? ' selected' : ''}">
        ${isParent ? '<div class="file-checkbox-placeholder"></div>' : `<input type="checkbox" class="file-checkbox" data-name="${escapedName}" ${isSelected ? 'checked' : ''} onchange="event.stopPropagation(); window.toggleFile('${escapedName}', this.checked)">`}
        <div class="file-info${isDir ? ' clickable' : ''}" onclick="${clickHandler}">
          <div class="file-name">${isDir ? '📁' : '📄'} ${file.name}</div>
          <div class="file-meta">${meta}${!isParent ? ' - ' + formatDate(file.modified) : ''}</div>
        </div>
      </div>
    `;
  }).join('');

  updateSortHeader();
}

function loadFiles() {
  fetch('/files' + qs())
    .then(res => res.json())
    .then(files => {
      filesData = files;
      renderFiles();
    })
    .catch(() => alert(__t('loadFailed')));
}

function applyReadonlyUI() {
  const banner = document.getElementById('readonlyBanner');
  if (READONLY) {
    banner.style.display = 'block';
    banner.textContent = '🔒 ' + __t('readonlyActive');
    document.querySelector('.upload-section').style.display = 'none';
  } else {
    banner.style.display = 'none';
  }
  updateToolbar();
}

function updateToolbar() {
  const count = selectedFiles.size;
  const hasOne = count === 1;
  const hasMany = count >= 1;

  const firstFile = hasOne ? filesData.find(f => selectedFiles.has(f.name)) : null;
  const firstFileName = firstFile ? firstFile.name : '';
  const ext = firstFileName ? firstFileName.split('.').pop()?.toLowerCase() : '';
  const isEditable = hasOne && firstFile && !firstFile.isDirectory && editableExts.includes(ext);
  const isViewable = hasOne && firstFile && !firstFile.isDirectory && viewableExts.includes(ext);

  document.querySelectorAll('.toolbar-btn').forEach(btn => btn.disabled = true);
  viewBtn.disabled = !hasMany || !isViewable;
  downloadBtn.disabled = !hasMany;
  createFileBtn.disabled = READONLY;
  createFolderBtn.disabled = READONLY;
  if (!READONLY) {
    renameBtn.disabled = !hasOne;
    editBtn.disabled = !isEditable;
    moveBtn.disabled = !hasMany;
    copyBtn.disabled = !hasMany;
    removeBtn.disabled = !hasMany;
  }
}

function uploadFile() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  if (selectedFiles_upload.length === 0) return;

  const files = selectedFiles_upload;
  const totalFiles = files.length;
  let uploadedCount = 0;
  let totalBytes = 0;
  let loadedBytes = 0;

  for (const f of files) totalBytes += f.size;

  uploadBtn.disabled = true;
  progressContainer.style.display = 'block';

  function uploadNext() {
    if (uploadedCount >= totalFiles) {
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressSize.textContent = '0 MB / 0 MB';
        fileInput.value = '';
        fileName.textContent = __t('noFileSelected');
        selectedFiles_upload = [];
        loadFiles();
      }, 500);
      return;
    }

    const file = files[uploadedCount];
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const currentLoaded = loadedBytes + e.loaded;
        const totalPercent = Math.round((currentLoaded / totalBytes) * 100);
        const loadedMB = (currentLoaded / (1024 * 1024)).toFixed(2);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

        progressBar.style.width = totalPercent + '%';
        progressPercent.textContent = totalPercent + '%';
        progressSize.textContent = `${loadedMB} MB / ${totalMB} MB (${uploadedCount + 1}/${totalFiles})`;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        loadedBytes += file.size;
        uploadedCount++;
        uploadNext();
      } else {
        alert(__t('uploadFailed') + ': ' + file.name);
        loadedBytes += file.size;
        uploadedCount++;
        uploadNext();
      }
    });

    xhr.addEventListener('error', () => {
      alert(__t('uploadError') + ': ' + file.name);
      loadedBytes += file.size;
      uploadedCount++;
      uploadNext();
    });

    xhr.open('POST', '/upload' + qs());
    xhr.send(formData);
  }

  uploadNext();
}

function isViewable(name) {
  const ext = name.split('.').pop().toLowerCase();
  return viewableExts.includes(ext);
}

function viewFile(filename) {
  window.location.href = '/view/' + encodeURIComponent(filename) + qs();
}

function downloadFile(filename) {
  window.location.href = '/download/' + encodeURIComponent(filename) + qs();
}

function deleteFile(filename) {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  if (!confirm(__t('confirmDelete').replace('{name}', filename))) return;

  fetch('/delete/' + encodeURIComponent(filename) + qs(), { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      selectedFiles.delete(filename);
      loadFiles();
    })
    .catch(() => alert(__t('deleteFailed')));
}

function renameFile(filename) {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const newname = prompt(__t('enterName'), filename);
  if (!newname || newname === filename) return;

  fetch('/rename/' + encodeURIComponent(filename) + qs(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newname })
  })
    .then(res => res.json())
    .then(() => {
      selectedFiles.delete(filename);
      if (selectedFiles.size === 0) updateToolbar();
      loadFiles();
    })
    .catch(() => alert(__t('renameFailed')));
}

function createFile() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const name = prompt(__t('enterFileName'));
  if (!name) return;
  fetch('/touch' + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) loadFiles();
      else alert(__t('createFailed'));
    })
    .catch(() => alert(__t('createFailed')));
}

function createFolder() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const name = prompt(__t('enterFolderName'));
  if (!name) return;
  fetch('/mkdir' + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) loadFiles();
      else alert(__t('createFailed'));
    })
    .catch(() => alert(__t('createFailed')));
}

function editFile(filename) {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const fileUrl = qs();
  window.location.href = '/editor.html?path=' + encodeURIComponent(currentPath) + '&file=' + encodeURIComponent(filename) + '&locale=' + locale;
}

function renameSelected() {
  const items = filesData.filter(f => selectedFiles.has(f.name));
  if (items.length !== 1) return;
  renameFile(items[0].name);
}

function editSelected() {
  const items = filesData.filter(f => selectedFiles.has(f.name) && !f.isDirectory && editableExts.includes(f.name.split('.').pop()?.toLowerCase()));
  if (items.length === 0) { alert(__t('noEditableFile')); return; }
  editFile(items[0].name);
}

function moveSelected() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const names = filesData.filter(f => selectedFiles.has(f.name)).map(f => f.name);
  if (names.length === 0) return;
  const destination = prompt(__t('enterDestination'));
  if (!destination) return;
  fetch('/move' + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names, destination })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) { selectedFiles.clear(); loadFiles(); }
      else alert(__t('moveFailed'));
    })
    .catch(() => alert(__t('moveFailed')));
}

function copySelected() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const names = filesData.filter(f => selectedFiles.has(f.name)).map(f => f.name);
  if (names.length === 0) return;
  const destination = prompt(__t('enterDestination'));
  if (!destination) return;
  fetch('/copy' + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names, destination })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) { selectedFiles.clear(); loadFiles(); }
      else alert(__t('copyFailed'));
    })
    .catch(() => alert(__t('copyFailed')));
}

function viewSelected() {
  const items = filesData.filter(f => selectedFiles.has(f.name) && !f.isDirectory && viewableExts.includes(f.name.split('.').pop()?.toLowerCase()));
  if (items.length === 0) { alert(__t('noViewableFile')); return; }
  viewFile(items[0].name);
}

function downloadSelected() {
  const items = filesData.filter(f => selectedFiles.has(f.name));
  if (items.length === 0) return;
  downloadFile(items[0].name);
}

function removeSelected() {
  if (READONLY) { alert(__t('readonlyActive')); return; }
  const names = filesData.filter(f => selectedFiles.has(f.name)).map(f => f.name);
  if (names.length === 0) return;
  if (!confirm(__t('confirmDeleteBulk').replace('{count}', names.length))) return;
  fetch('/bulk-delete' + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) { selectedFiles.clear(); loadFiles(); }
      else alert(__t('deleteFailed'));
    })
    .catch(() => alert(__t('deleteFailed')));
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  return new Date(date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US');
}

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  currentPath = params.get('path') || '/';
  loadFiles();
});

fetch('/config')
  .then(res => res.json())
  .then(config => { READONLY = config.readonly; })
  .catch(() => {})
  .finally(() => {
    fetch('/languages.json')
      .then(res => res.json())
      .then(data => {
        translations = data;
        langSelect.value = locale;
        setLocale(locale);
        applyReadonlyUI();
        loadFiles();
      })
      .catch(() => {
        applyReadonlyUI();
        loadFiles();
      });
  });

selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFiles_upload = Array.from(e.target.files);
  if (selectedFiles_upload.length > 0) {
    if (selectedFiles_upload.length === 1) {
      fileName.textContent = selectedFiles_upload[0].name;
    } else {
      fileName.textContent = selectedFiles_upload.length + ' dosya seçildi';
    }
    uploadBtn.disabled = false;
  }
});

uploadBtn.addEventListener('click', uploadFile);
refreshBtn.addEventListener('click', () => loadFiles());

selectAllCheckbox.addEventListener('change', (e) => {
  toggleSelectAll(e.target.checked);
});

langSelect.addEventListener('change', (e) => {
  setLocale(e.target.value);
});

searchInput.addEventListener('input', () => {
  selectAllCheckbox.checked = false;
  renderFiles();
});

document.querySelector('.sort-header').addEventListener('click', (e) => {
  const btn = e.target.closest('.sort-btn');
  if (!btn) return;
  const field = btn.getAttribute('data-sort');
  if (field === sortBy) {
    sortAsc = !sortAsc;
  } else {
    sortBy = field;
    sortAsc = true;
  }
  renderFiles();
});

const setEmojiFavicon = (emoji = "🔍") => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = "56px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 32, 36);
  const favicon = document.getElementById("dynamic-favicon");
  favicon.href = canvas.toDataURL("image/png");
}

window.addEventListener('load', () => setEmojiFavicon('📁'));

window.toggleFile = toggleFile;
window.navigateTo = navigateTo;
window.viewFile = viewFile;
window.downloadFile = downloadFile;

window.createFile = createFile;
window.createFolder = createFolder;
window.editFile = editFile;
window.renameSelected = renameSelected;
window.editSelected = editSelected;
window.moveSelected = moveSelected;
window.copySelected = copySelected;
window.viewSelected = viewSelected;
window.downloadSelected = downloadSelected;
window.removeSelected = removeSelected;
