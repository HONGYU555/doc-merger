/* ========================================
   doc-merger — 設計原型互動腳本
   功能：檔案上傳、拖曳排序、UI 狀態管理
   後續實作時：替換為 Vue 3 + Element Plus
   ======================================== */

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTS = ['.docx', '.txt'];

// 狀態
let files = []; // [{ id, file, name, ext, size }]

// DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const emptyState = document.getElementById('emptyState');
const fileCount = document.getElementById('fileCount');
const clearAllBtn = document.getElementById('clearAll');
const mergeBtn = document.getElementById('mergeBtn');
const mergeHint = document.getElementById('mergeHint');
const customSeparator = document.getElementById('customSeparator');
const resultCard = document.getElementById('resultCard');
const resultSize = document.getElementById('resultSize');
const downloadLink = document.getElementById('downloadLink');

// 工具
const fmtSize = (b) => {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
};
const ext = (name) => name.toLowerCase().slice(name.lastIndexOf('.'));
const icon = (e) => (e === '.docx' ? '📘' : '📄');

// ---------- 上傳 ----------
dropzone.addEventListener('click', (e) => {
  if (files.length >= MAX_FILES) return;
  fileInput.click();
});
['dragenter', 'dragover'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    if (files.length >= MAX_FILES) return;
    dropzone.classList.add('dragging');
  })
);
['dragleave', 'drop'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
  })
);
dropzone.addEventListener('drop', (e) => {
  const dropped = Array.from(e.dataTransfer.files);
  addFiles(dropped);
});
fileInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
  fileInput.value = '';
});

function addFiles(newFiles) {
  const remaining = MAX_FILES - files.length;
  if (remaining <= 0) {
    alert(`最多只能上傳 ${MAX_FILES} 個檔案`);
    return;
  }
  let added = 0;
  for (const f of newFiles) {
    if (added >= remaining) break;
    if (!ACCEPTED_EXTS.includes(ext(f.name))) {
      console.warn('跳過不支援的檔案:', f.name);
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      alert(`檔案 ${f.name} 超過 10MB 上限`);
      continue;
    }
    files.push({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      ext: ext(f.name),
      size: f.size,
    });
    added++;
  }
  render();
}

// ---------- 列表渲染 ----------
function render() {
  fileCount.textContent = files.length;
  fileList.innerHTML = '';
  if (files.length === 0) {
    emptyState.hidden = false;
    clearAllBtn.hidden = true;
    mergeBtn.disabled = true;
    mergeHint.textContent = '請先上傳至少一個檔案';
    dropzone.classList.toggle('disabled', false);
    return;
  }
  emptyState.hidden = true;
  clearAllBtn.hidden = false;
  mergeBtn.disabled = false;
  mergeHint.textContent = `準備合併 ${files.length} 個檔案`;
  dropzone.classList.toggle('disabled', files.length >= MAX_FILES);

  files.forEach((f, idx) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.draggable = true;
    li.dataset.id = f.id;
    li.innerHTML = `
      <span class="drag-handle" title="拖曳排序">⋮⋮</span>
      <span class="file-icon">${icon(f.ext)}</span>
      <div class="file-info">
        <div class="file-name">${idx + 1}. ${escapeHtml(f.name)}</div>
        <div class="file-meta">${f.ext.toUpperCase()} · ${fmtSize(f.size)}</div>
      </div>
      <button class="remove-btn" data-id="${f.id}" title="移除">✕</button>
    `;
    fileList.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 移除
fileList.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  files = files.filter((f) => f.id !== btn.dataset.id);
  render();
});

// 清空
clearAllBtn.addEventListener('click', () => {
  files = [];
  render();
});

// ---------- 拖曳排序 ----------
let dragSrcId = null;
fileList.addEventListener('dragstart', (e) => {
  const item = e.target.closest('.file-item');
  if (!item) return;
  dragSrcId = item.dataset.id;
  item.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
fileList.addEventListener('dragend', (e) => {
  const item = e.target.closest('.file-item');
  if (item) item.classList.remove('dragging');
});
fileList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const item = e.target.closest('.file-item');
  if (!item || item.dataset.id === dragSrcId) return;
  const rect = item.getBoundingClientRect();
  const after = e.clientY > rect.top + rect.height / 2;
  item.parentNode.insertBefore(
    document.querySelector(`[data-id="${dragSrcId}"]`),
    after ? item.nextSibling : item
  );
});
fileList.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!dragSrcId) return;
  const orderedIds = Array.from(fileList.querySelectorAll('.file-item')).map((el) => el.dataset.id);
  files = orderedIds.map((id) => files.find((f) => f.id === id)).filter(Boolean);
  dragSrcId = null;
  render();
});

// ---------- 分隔符自訂切換 ----------
document.querySelectorAll('input[name="separator"]').forEach((r) => {
  r.addEventListener('change', () => {
    customSeparator.hidden = r.value !== 'custom' || !r.checked;
  });
});

// ---------- 合併按鈕（mock） ----------
mergeBtn.addEventListener('click', async () => {
  if (files.length === 0) return;
  mergeBtn.disabled = true;
  mergeBtn.querySelector('.btn-label').textContent = '合併中…';
  mergeBtn.querySelector('.btn-spinner').hidden = false;

  // 真實實作：呼叫後端 /api/merge
  await new Promise((r) => setTimeout(r, 1200));

  const total = files.reduce((s, f) => s + f.size, 0);
  resultSize.textContent = fmtSize(total) + '（預估）';
  resultCard.hidden = false;
  downloadLink.href = '#';
  downloadLink.textContent = '下載合併檔（mock）';

  mergeBtn.querySelector('.btn-label').textContent = '合併檔案';
  mergeBtn.querySelector('.btn-spinner').hidden = true;
  mergeBtn.disabled = false;
  resultCard.scrollIntoView({ behavior: 'smooth' });
});

// 初始
render();
