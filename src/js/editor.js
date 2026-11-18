const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const tabList = document.getElementById('tab-list');
const tabAddBtn = document.getElementById('tab-add');
const statusFile = document.getElementById('status-file');
const statusDirty = document.getElementById('status-dirty');
const statusMsg = document.getElementById('status-msg');
const statusCount = document.getElementById('status-count');

// ==================== 多标签管理 ====================
let tabs = [];
let activeTabId = null;
let nextTabId = 1;
const MAX_HISTORY = 100;

function getFileNameFromPath(filePath) {
  if (!filePath) return null;
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

function getBaseName(fileName) {
  if (!fileName) return 'export';
  return fileName.replace(/\.md$/i, '').replace(/\.markdown$/i, '');
}

function createTab(filePath = null, content = '') {
  const id = nextTabId++;
  const fileName = getFileNameFromPath(filePath) || `未命名 ${id}`;
  const history = [];
  let historyIndex = -1;

  // 初始入栈
  history.push(content);
  historyIndex = 0;

  const tab = {
    id,
    filePath,
    fileName,
    content,
    isDirty: false,
    history,
    historyIndex,
    isNew: !filePath
  };

  tabs.push(tab);
  return tab;
}

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId);
}

function findTabByPath(filePath) {
  return tabs.find(t => t.filePath === filePath);
}

function switchTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  // 保存当前编辑器状态到旧标签
  const oldTab = getActiveTab();
  if (oldTab) {
    oldTab.content = editor.value;
  }

  activeTabId = tabId;
  editor.value = tab.content;
  updatePreview();
  renderTabs();
  updateStatus();
}

async function closeTab(tabId, force = false) {
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;
  const tab = tabs[idx];

  if (!force && tab.isDirty) {
    if (window.electronAPI && window.electronAPI.confirmCloseTab) {
      const result = await window.electronAPI.confirmCloseTab(tab.fileName);
      if (result.action === 2) return; // 取消
      if (result.action === 0) {
        // 保存
        const saveResult = await window.electronAPI.saveFile(tab.content, tab.filePath);
        if (saveResult.success) {
          tab.filePath = saveResult.path;
          tab.fileName = getFileNameFromPath(saveResult.path);
          tab.isDirty = false;
          tab.isNew = false;
        } else {
          return; // 保存失败，不关闭
        }
      }
      // action === 1: 不保存，继续关闭
    } else {
      if (!confirm(`"${tab.fileName}" 有未保存的更改，确定要关闭吗？`)) {
        return;
      }
    }
  }

  tabs.splice(idx, 1);

  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      const newIdx = Math.min(idx, tabs.length - 1);
      activeTabId = tabs[newIdx].id;
      editor.value = tabs[newIdx].content;
    } else {
      activeTabId = null;
      editor.value = '';
    }
    updatePreview();
  }

  renderTabs();
  updateStatus();
}

function renderTabs() {
  tabList.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab-item' + (tab.id === activeTabId ? ' active' : '');
    el.innerHTML = `
      <span class="tab-name">${escapeHtml(tab.fileName)}</span>
      <span class="tab-dirty" style="display:${tab.isDirty ? 'inline' : 'none'}">&#9679;</span>
      <span class="tab-close" data-id="${tab.id}">&#10005;</span>
    `;
    el.addEventListener('click', async (e) => {
      if (e.target.classList.contains('tab-close')) {
        e.stopPropagation();
        await closeTab(tab.id);
      } else {
        switchTab(tab.id);
      }
    });
    tabList.appendChild(el);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== 状态栏 ====================
function updateStatus() {
  const tab = getActiveTab();
  if (!tab) {
    statusFile.textContent = '未命名';
    statusDirty.textContent = '';
    statusCount.textContent = '0 字';
    return;
  }
  statusFile.textContent = tab.fileName;
  statusDirty.textContent = tab.isDirty ? '● 未保存' : '';
  statusCount.textContent = `${editor.value.length} 字`;
}

let statusMsgTimer;
function showStatusMessage(msg, duration = 2000) {
  statusMsg.textContent = msg;
  statusMsg.classList.add('show');
  clearTimeout(statusMsgTimer);
  statusMsgTimer = setTimeout(() => {
    statusMsg.classList.remove('show');
  }, duration);
}

// ==================== 历史记录（撤销/重做） ====================
function pushHistoryForTab(tab) {
  if (tab.historyIndex >= 0 && tab.history[tab.historyIndex] === tab.content) return;
  if (tab.historyIndex < tab.history.length - 1) {
    tab.history.splice(tab.historyIndex + 1);
  }
  tab.history.push(tab.content);
  if (tab.history.length > MAX_HISTORY) {
    tab.history.shift();
  } else {
    tab.historyIndex++;
  }
}

function undoForTab(tab) {
  if (tab.historyIndex > 0) {
    tab.historyIndex--;
    tab.content = tab.history[tab.historyIndex];
    editor.value = tab.content;
    updatePreview();
    updateStatus();
  }
}

function redoForTab(tab) {
  if (tab.historyIndex < tab.history.length - 1) {
    tab.historyIndex++;
    tab.content = tab.history[tab.historyIndex];
    editor.value = tab.content;
    updatePreview();
    updateStatus();
  }
}

// ==================== 编辑器事件 ====================
let typingTimer;
editor.addEventListener('input', () => {
  const tab = getActiveTab();
  if (!tab) return;

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    pushHistoryForTab(tab);
  }, 500);

  tab.content = editor.value;
  if (!tab.isDirty) {
    tab.isDirty = true;
    renderTabs();
  }
  updatePreview();
  updateStatus();
});

// 支持 Tab 键缩进
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;

    const tab = getActiveTab();
    if (tab) {
      tab.content = editor.value;
      if (!tab.isDirty) {
        tab.isDirty = true;
        renderTabs();
      }
      updatePreview();
      updateStatus();
    }
  }
});

// 触发预览更新
function updatePreview() {
  const content = editor.value;
  preview.dispatchEvent(new CustomEvent('contentchange', { detail: { content } }));
}

// ==================== 查找替换 ====================
let findReplacePanel = null;
let findInput = null;
let replaceInput = null;

function showFindReplace(showReplace) {
  if (!findReplacePanel) {
    findReplacePanel = document.getElementById('find-replace-panel');
    findInput = document.getElementById('find-input');
    replaceInput = document.getElementById('replace-input');

    document.getElementById('find-next-btn').addEventListener('click', findNext);
    document.getElementById('find-prev-btn').addEventListener('click', findPrev);
    document.getElementById('replace-btn').addEventListener('click', replaceOne);
    document.getElementById('replace-all-btn').addEventListener('click', replaceAll);
    document.getElementById('find-replace-close').addEventListener('click', hideFindReplace);

    findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') findNext();
      if (e.key === 'Escape') hideFindReplace();
    });
  }

  document.getElementById('replace-row').style.display = showReplace ? 'flex' : 'none';
  findReplacePanel.style.display = 'block';
  findInput.focus();
}

function hideFindReplace() {
  if (findReplacePanel) {
    findReplacePanel.style.display = 'none';
  }
}

let lastSearchIndex = 0;

function findNext() {
  const query = findInput.value;
  if (!query) return;
  const text = editor.value;
  const index = text.indexOf(query, lastSearchIndex);
  if (index !== -1) {
    editor.selectionStart = index;
    editor.selectionEnd = index + query.length;
    editor.focus();
    lastSearchIndex = index + 1;
  } else {
    const indexFromStart = text.indexOf(query, 0);
    if (indexFromStart !== -1) {
      editor.selectionStart = indexFromStart;
      editor.selectionEnd = indexFromStart + query.length;
      editor.focus();
      lastSearchIndex = indexFromStart + 1;
    }
  }
}

function findPrev() {
  const query = findInput.value;
  if (!query) return;
  const text = editor.value.substring(0, lastSearchIndex - 1);
  const index = text.lastIndexOf(query);
  if (index !== -1) {
    editor.selectionStart = index;
    editor.selectionEnd = index + query.length;
    editor.focus();
    lastSearchIndex = index;
  }
}

function replaceOne() {
  const query = findInput.value;
  const replacement = replaceInput.value;
  if (!query) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selected = editor.value.substring(start, end);
  if (selected === query) {
    editor.setRangeText(replacement, start, end, 'end');
    const tab = getActiveTab();
    if (tab) {
      tab.content = editor.value;
      pushHistoryForTab(tab);
      if (!tab.isDirty) {
        tab.isDirty = true;
        renderTabs();
      }
      updatePreview();
      updateStatus();
    }
  } else {
    findNext();
  }
}

function replaceAll() {
  const query = findInput.value;
  const replacement = replaceInput.value;
  if (!query) return;
  editor.value = editor.value.split(query).join(replacement);
  const tab = getActiveTab();
  if (tab) {
    tab.content = editor.value;
    pushHistoryForTab(tab);
    if (!tab.isDirty) {
      tab.isDirty = true;
      renderTabs();
    }
    updatePreview();
    updateStatus();
  }
}

// ==================== 新建/打开/保存 ====================
function newFile() {
  const tab = createTab(null, '');
  activeTabId = tab.id;
  editor.value = '';
  updatePreview();
  renderTabs();
  updateStatus();
}

function openFile(content, filePath) {
  const existing = findTabByPath(filePath);
  if (existing) {
    switchTab(existing.id);
    return;
  }
  const tab = createTab(filePath, content);
  activeTabId = tab.id;
  editor.value = content;
  updatePreview();
  renderTabs();
  updateStatus();
}

function getExportDefaultName(extension) {
  const tab = getActiveTab();
  if (!tab) return `export.${extension}`;
  return `${getBaseName(tab.fileName)}.${extension}`;
}

async function saveCurrentTab(saveAs = false) {
  const tab = getActiveTab();
  if (!tab) return;

  // 更新内容
  tab.content = editor.value;
  const filePath = saveAs ? null : tab.filePath;

  const result = await window.electronAPI.saveFile(tab.content, filePath);
  if (result.success) {
    tab.filePath = result.path;
    tab.fileName = getFileNameFromPath(result.path);
    tab.isDirty = false;
    tab.isNew = false;
    renderTabs();
    updateStatus();
    showStatusMessage('保存成功');
  }
}

// 新建按钮
tabAddBtn.addEventListener('click', newFile);

// ==================== IPC 事件 ====================
if (window.electronAPI) {
  window.electronAPI.onFileOpened((content, path) => {
    openFile(content, path);
  });

  window.electronAPI.onMenuNewFile(() => {
    newFile();
  });

  window.electronAPI.onMenuSave(() => {
    saveCurrentTab(false);
  });

  window.electronAPI.onMenuSaveAs(() => {
    saveCurrentTab(true);
  });

  window.electronAPI.onMenuUndo(() => {
    const tab = getActiveTab();
    if (tab) undoForTab(tab);
  });

  window.electronAPI.onMenuRedo(() => {
    const tab = getActiveTab();
    if (tab) redoForTab(tab);
  });

  window.electronAPI.onMenuFind(() => {
    showFindReplace(false);
  });

  window.electronAPI.onMenuReplace(() => {
    showFindReplace(true);
  });

  // 导出 PDF / DOCX
  window.electronAPI.onExportPdf(async () => {
    const html = preview.innerHTML;
    const defaultName = getExportDefaultName('pdf');
    const previewTheme = document.body.getAttribute('data-preview-theme') || 'light';
    const result = await window.electronAPI.exportPdf(html, previewTheme, defaultName);
    if (result.success) {
      showStatusMessage('PDF 导出成功');
    } else {
      showStatusMessage('PDF 导出失败: ' + (result.error || '未知错误'), 3000);
    }
  });

  window.electronAPI.onExportDocx(async () => {
    const markdown = editor.value;
    const defaultName = getExportDefaultName('docx');
    const result = await window.electronAPI.exportDocx(markdown, defaultName);
    if (result.success) {
      showStatusMessage('DOCX 导出成功');
    } else {
      showStatusMessage('DOCX 导出失败: ' + (result.error || '未知错误'), 3000);
    }
  });

  // 关闭前检查未保存
  window.electronAPI.onCheckUnsaved(() => {
    const hasUnsaved = tabs.some(t => t.isDirty);
    window.electronAPI.sendUnsavedResult(hasUnsaved);
  });

  window.electronAPI.onSaveAllAndQuit(async () => {
    // 保存当前编辑器内容到激活标签
    const currentTab = getActiveTab();
    if (currentTab) currentTab.content = editor.value;

    // 保存所有未保存的标签
    for (const tab of tabs) {
      if (tab.isDirty) {
        const result = await window.electronAPI.saveFile(tab.content, tab.filePath);
        if (result.success) {
          tab.filePath = result.path;
          tab.fileName = getFileNameFromPath(result.path);
          tab.isDirty = false;
          tab.isNew = false;
        }
      }
    }
    renderTabs();
    updateStatus();
    window.electronAPI.sendSaveAllComplete();
  });
}

// ==================== 初始化 ====================
// 显示版本号
const versionEl = document.getElementById('toolbar-version');
if (versionEl && window.electronAPI && window.electronAPI.appVersion) {
  versionEl.textContent = 'v' + window.electronAPI.appVersion;
}

// 创建一个默认空标签
newFile();
