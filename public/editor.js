const params = new URLSearchParams(window.location.search);
const currentPath = params.get('path') || '/';
const filename = params.get('file');
let locale = params.get('locale') || localStorage.getItem('nfilemanager-locale') || 'tr';
let translations = {};

const editorTitle = document.getElementById('editorTitle');
const editorContent = document.getElementById('editorContent');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const backBtn = document.getElementById('backBtn');
const editorStatus = document.getElementById('editorStatus');

function qs() {
  return currentPath === '/' ? '' : '?path=' + encodeURIComponent(currentPath);
}

function __t(key) {
  return translations[locale]?.[key] || key;
}

function setLocale(lang) {
  locale = lang;
  localStorage.setItem('nfilemanager-locale', lang);
  updateUI();
}

function updateUI() {
  document.title = __t('editorTitle');
  editorTitle.textContent = filename ? `📝 ${filename}` : __t('editorTitle');
  saveBtn.textContent = __t('save');
  cancelBtn.textContent = __t('cancel');
  backBtn.textContent = __t('backToFiles');
}

function goBack() {
  window.location.href = '/?path=' + encodeURIComponent(currentPath);
}

function loadContent() {
  if (!filename) {
    editorStatus.textContent = 'No file specified.';
    saveBtn.disabled = true;
    return;
  }
  editorStatus.textContent = 'Loading...';
  fetch('/read/' + encodeURIComponent(filename) + qs())
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        editorContent.value = data.content;
        editorStatus.textContent = '';
      } else {
        editorStatus.textContent = __t('readFailed');
      }
    })
    .catch(() => {
      editorStatus.textContent = __t('readFailed');
    });
}

function saveContent() {
  const content = editorContent.value;
  editorStatus.textContent = 'Saving...';
  saveBtn.disabled = true;
  fetch('/save/' + encodeURIComponent(filename) + qs(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        editorStatus.textContent = __t('saved');
        setTimeout(() => { editorStatus.textContent = ''; }, 2000);
      } else {
        editorStatus.textContent = __t('saveFailed');
      }
      saveBtn.disabled = false;
    })
    .catch(() => {
      editorStatus.textContent = __t('saveFailed');
      saveBtn.disabled = false;
    });
}

fetch('/languages.json')
  .then(res => res.json())
  .then(data => {
    translations = data;
    updateUI();
    loadContent();
  })
  .catch(() => {
    editorContent.placeholder = 'Error loading translations';
  });

saveBtn.addEventListener('click', saveContent);
cancelBtn.addEventListener('click', goBack);
backBtn.addEventListener('click', goBack);

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveContent();
  }
});
