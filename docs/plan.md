# Markdown 渲染与导出工具 - 实现计划

> **For agentic workers:** 按任务顺序逐步执行，每完成一个任务打勾确认。

**Goal:** 搭建一个基于 Electron 的 Markdown 编辑器，支持左右分栏实时预览、公式/图表渲染、栏位折叠、导出 PDF/DOCX。

**Architecture:** 使用 Electron 主进程管理窗口和文件导出，渲染进程通过预加载脚本与主进程安全通信。前端使用 marked.js 渲染 Markdown，KaTeX 渲染公式，Mermaid 渲染图表，highlight.js 高亮代码。

**Tech Stack:** Electron, Node.js, marked, KaTeX, Mermaid, highlight.js, electron-pdf-window (或原生 printToPDF), pandoc (外部依赖)

---

## 文件结构

```
markdown-editor/
├── package.json              # 项目依赖与脚本
├── main.js                   # Electron 主进程（窗口、菜单、导出）
├── preload.js                # 预加载脚本（IPC 安全桥梁）
├── src/
│   ├── index.html            # 主页面（左右分栏布局）
│   ├── css/
│   │   └── style.css         # 界面样式（分栏、折叠、滚动条）
│   └── js/
│       ├── editor.js         # 左侧编辑器逻辑（textarea 事件）
│       ├── preview.js        # 右侧预览渲染逻辑（marked + KaTeX + Mermaid）
│       └── layout.js         # 栏位折叠/展开控制
```

---

## Task 1: 初始化 Node.js 项目

**Files:**
- Create: `package.json`

- [ ] **Step 1: 创建 package.json**

在 `d:\桌面\新建文件夹` 下创建：

```json
{
  "name": "markdown-editor",
  "version": "1.0.0",
  "description": "Markdown renderer and exporter",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "echo \"No tests yet\""
  },
  "devDependencies": {
    "electron": "^30.0.0"
  },
  "dependencies": {}
}
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`
Expected: `node_modules` 文件夹生成，无报错

- [ ] **Step 3: 验证 Electron 安装**

Run: `npx electron --version`
Expected: 输出版本号，如 `v30.x.x`

---

## Task 2: 创建 Electron 主进程

**Files:**
- Create: `main.js`

- [ ] **Step 1: 编写主进程代码**

```javascript
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();

  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开',
          accelerator: 'Ctrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const content = fs.readFileSync(result.filePaths[0], 'utf-8');
              mainWindow.webContents.send('file-opened', content);
            }
          }
        },
        {
          label: '保存',
          accelerator: 'Ctrl+S',
          click: async () => {
            mainWindow.webContents.send('request-save');
          }
        },
        { type: 'separator' },
        {
          label: '导出 PDF',
          accelerator: 'Ctrl+Shift+P',
          click: async () => {
            mainWindow.webContents.send('export-pdf');
          }
        },
        {
          label: '导出 DOCX',
          accelerator: 'Ctrl+Shift+D',
          click: async () => {
            mainWindow.webContents.send('export-docx');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 处理保存请求
ipcMain.handle('save-file', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// 处理 PDF 导出
ipcMain.handle('export-pdf', async (event, htmlContent) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!result.canceled) {
    // 创建临时窗口用于 PDF 导出
    const pdfWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: { contextIsolation: true }
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; padding: 40px; line-height: 1.6; }
          pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
          code { font-family: Consolas, monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `;

    await pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));
    await pdfWindow.webContents.executeJavaScript(`
      document.fonts.ready.then(() => true)
    `);

    const pdfData = await pdfWindow.webContents.printToPDF({
      marginsType: 1,
      printBackground: true,
      pageSize: 'A4'
    });

    fs.writeFileSync(result.filePath, pdfData);
    pdfWindow.close();
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// 处理 DOCX 导出（通过 pandoc）
ipcMain.handle('export-docx', async (event, markdownContent) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Word Document', extensions: ['docx'] }]
  });
  if (!result.canceled) {
    const tempMd = path.join(app.getPath('temp'), 'temp_export.md');
    fs.writeFileSync(tempMd, markdownContent, 'utf-8');

    const { exec } = require('child_process');
    const pandocCmd = `pandoc "${tempMd}" -o "${result.filePath}" --from markdown --to docx`;

    return new Promise((resolve) => {
      exec(pandocCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Pandoc error:', error);
          resolve({ success: false, error: 'pandoc not found. Please install pandoc: https://pandoc.org/installing.html' });
        } else {
          resolve({ success: true, path: result.filePath });
        }
      });
    });
  }
  return { success: false };
});
```

---

## Task 3: 创建预加载脚本（IPC 桥梁）

**Files:**
- Create: `preload.js`

- [ ] **Step 1: 编写预加载脚本**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, content) => callback(content)),
  onRequestSave: (callback) => ipcRenderer.on('request-save', callback),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),

  // 导出
  onExportPdf: (callback) => ipcRenderer.on('export-pdf', callback),
  onExportDocx: (callback) => ipcRenderer.on('export-docx', callback),
  exportPdf: (htmlContent) => ipcRenderer.invoke('export-pdf', htmlContent),
  exportDocx: (markdownContent) => ipcRenderer.invoke('export-docx', markdownContent)
});
```

---

## Task 4: 创建主页面 HTML

**Files:**
- Create: `src/index.html`

- [ ] **Step 1: 编写 HTML 结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 编辑器</title>
  <!-- KaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <!-- Mermaid -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <!-- Highlight.js -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/npm/highlight.js@11/lib/highlight.min.js"></script>
  <!-- Marked -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12/lib/marked.umd.min.js"></script>
  <!-- 自定义样式 -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- 顶部工具栏 -->
  <div class="toolbar">
    <button id="toggle-editor" title="切换编辑栏">编辑</button>
    <button id="toggle-preview" title="切换预览栏">预览</button>
    <span class="toolbar-separator"></span>
    <span class="toolbar-info">Ctrl+O 打开 | Ctrl+S 保存 | Ctrl+Shift+P PDF | Ctrl+Shift+D DOCX</span>
  </div>

  <!-- 主内容区 -->
  <div class="main-container">
    <!-- 左侧编辑栏 -->
    <div class="editor-pane" id="editor-pane">
      <div class="pane-header">Markdown 源码</div>
      <textarea id="editor" placeholder="在此粘贴 Markdown 内容..." spellcheck="false"></textarea>
    </div>

    <!-- 分隔线 -->
    <div class="resizer" id="resizer"></div>

    <!-- 右侧预览栏 -->
    <div class="preview-pane" id="preview-pane">
      <div class="pane-header">实时预览</div>
      <div id="preview" class="preview-content"></div>
    </div>
  </div>

  <!-- 脚本 -->
  <script src="js/editor.js"></script>
  <script src="js/preview.js"></script>
  <script src="js/layout.js"></script>
</body>
</html>
```

---

## Task 5: 创建 CSS 样式

**Files:**
- Create: `src/css/style.css`

- [ ] **Step 1: 编写样式**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1e1e1e;
  color: #d4d4d4;
}

/* 工具栏 */
.toolbar {
  height: 40px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar button {
  padding: 4px 14px;
  background: #0e639c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.toolbar button:hover {
  background: #1177bb;
}

.toolbar button.active {
  background: #094771;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #555;
  margin: 0 8px;
}

.toolbar-info {
  font-size: 12px;
  color: #888;
  margin-left: auto;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 编辑栏 */
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  transition: flex 0.3s ease;
}

.editor-pane.collapsed {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
}

.pane-header {
  height: 28px;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  color: #bbbbbb;
  flex-shrink: 0;
}

#editor {
  flex: 1;
  width: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 16px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

/* 分隔线 */
.resizer {
  width: 4px;
  background: #3e3e3e;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.2s;
}

.resizer:hover {
  background: #0e639c;
}

/* 预览栏 */
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  background: #ffffff;
  transition: flex 0.3s ease;
}

.preview-pane.collapsed {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
}

.preview-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  color: #333;
  font-size: 15px;
  line-height: 1.8;
}

/* 预览区 Markdown 样式 */
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #222;
}

.preview-content h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.preview-content h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 6px; }
.preview-content h3 { font-size: 1.25em; }

.preview-content p {
  margin-bottom: 12px;
}

.preview-content ul,
.preview-content ol {
  margin-bottom: 12px;
  padding-left: 28px;
}

.preview-content li {
  margin-bottom: 4px;
}

.preview-content blockquote {
  border-left: 4px solid #ddd;
  margin: 12px 0;
  padding: 8px 16px;
  background: #f9f9f9;
  color: #555;
}

.preview-content pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.preview-content code {
  font-family: "Consolas", "Monaco", monospace;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.preview-content pre code {
  background: none;
  padding: 0;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-content th,
.preview-content td {
  border: 1px solid #ddd;
  padding: 10px 14px;
  text-align: left;
}

.preview-content th {
  background: #f5f5f5;
  font-weight: 600;
}

.preview-content tr:nth-child(even) {
  background: #fafafa;
}

.preview-content img {
  max-width: 100%;
  height: auto;
}

.preview-content hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 20px 0;
}

/* Mermaid 图表 */
.preview-content .mermaid {
  text-align: center;
  margin: 16px 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #666;
}
```

---

## Task 6: 创建编辑器逻辑

**Files:**
- Create: `src/js/editor.js`

- [ ] **Step 1: 编写编辑器脚本**

```javascript
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

// 默认示例内容
const defaultContent = `# 欢迎使用 Markdown 编辑器

在这里粘贴你的 Markdown 内容，右侧会实时预览渲染效果。

## 支持的功能

### 1. LaTeX 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\int_{a}^{b} f(x) \\mathrm{d}x = F(b) - F(a)
$$

### 2. 表格

| 功能 | 支持情况 |
|------|----------|
| Markdown 基础语法 | 支持 |
| LaTeX 公式 | 支持 |
| Mermaid 图表 | 支持 |
| 代码高亮 | 支持 |

### 3. 代码块

\`\`\`python
def hello():
    print("Hello, Markdown!")
\`\`\`

### 4. Mermaid 流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]
    C --> E[结束]
    D --> E
\`\`\`

---

**提示**：使用顶部工具栏的按钮可以折叠编辑栏或预览栏，获得更大的工作空间。
`;

editor.value = defaultContent;

// 触发预览更新
function updatePreview() {
  const content = editor.value;
  preview.dispatchEvent(new CustomEvent('contentchange', { detail: { content } }));
}

// 监听输入
editor.addEventListener('input', () => {
  updatePreview();
});

// 支持 Tab 键缩进
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    updatePreview();
  }
});

// 初始渲染
updatePreview();

// 从主进程接收打开的文件内容
if (window.electronAPI) {
  window.electronAPI.onFileOpened((content) => {
    editor.value = content;
    updatePreview();
  });

  window.electronAPI.onRequestSave(() => {
    window.electronAPI.saveFile(editor.value).then((result) => {
      if (result.success) {
        console.log('文件已保存:', result.path);
      }
    });
  });
}
```

---

## Task 7: 创建预览渲染逻辑

**Files:**
- Create: `src/js/preview.js`

- [ ] **Step 1: 编写预览渲染脚本**

```javascript
const previewEl = document.getElementById('preview');

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
});

// 自定义渲染器，支持 Mermaid
const renderer = new marked.Renderer();
const originalCode = renderer.code.bind(renderer);
renderer.code = function(code, language, escaped) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  return originalCode(code, language, escaped);
};
marked.use({ renderer });

// 渲染内容
async function renderContent(markdown) {
  // 1. 用 marked 转 HTML
  let html = marked.parse(markdown);
  previewEl.innerHTML = html;

  // 2. 高亮代码块
  previewEl.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });

  // 3. 渲染 Mermaid 图表
  if (window.mermaid) {
    mermaid.init(undefined, previewEl.querySelectorAll('.mermaid'));
  }

  // 4. 渲染 LaTeX 公式
  if (window.renderMathInElement) {
    renderMathInElement(previewEl, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

// 监听内容变化
previewEl.addEventListener('contentchange', (e) => {
  renderContent(e.detail.content);
});

// 初始化 Mermaid
mermaid.initialize({ startOnLoad: false });

// 导出 PDF 和 DOCX 的事件监听
if (window.electronAPI) {
  window.electronAPI.onExportPdf(async () => {
    // 获取当前渲染好的 HTML（不含脚本）
    const html = previewEl.innerHTML;
    const result = await window.electronAPI.exportPdf(html);
    if (result.success) {
      alert('PDF 导出成功！');
    } else {
      alert('PDF 导出失败：' + (result.error || '未知错误'));
    }
  });

  window.electronAPI.onExportDocx(async () => {
    const markdown = document.getElementById('editor').value;
    const result = await window.electronAPI.exportDocx(markdown);
    if (result.success) {
      alert('DOCX 导出成功！');
    } else {
      alert('DOCX 导出失败：' + (result.error || '未知错误') + '\n\n请确保已安装 pandoc：https://pandoc.org/installing.html');
    }
  });
}
```

---

## Task 8: 创建布局控制逻辑

**Files:**
- Create: `src/js/layout.js`

- [ ] **Step 1: 编写布局控制脚本**

```javascript
const editorPane = document.getElementById('editor-pane');
const previewPane = document.getElementById('preview-pane');
const resizer = document.getElementById('resizer');
const toggleEditorBtn = document.getElementById('toggle-editor');
const togglePreviewBtn = document.getElementById('toggle-preview');

let isEditorCollapsed = false;
let isPreviewCollapsed = false;

// 切换编辑栏
toggleEditorBtn.addEventListener('click', () => {
  isEditorCollapsed = !isEditorCollapsed;
  if (isEditorCollapsed) {
    editorPane.classList.add('collapsed');
    toggleEditorBtn.classList.remove('active');
    // 如果预览栏也折叠了，自动展开预览栏
    if (isPreviewCollapsed) {
      isPreviewCollapsed = false;
      previewPane.classList.remove('collapsed');
      togglePreviewBtn.classList.add('active');
    }
  } else {
    editorPane.classList.remove('collapsed');
    toggleEditorBtn.classList.add('active');
  }
  updateResizer();
});

// 切换预览栏
togglePreviewBtn.addEventListener('click', () => {
  isPreviewCollapsed = !isPreviewCollapsed;
  if (isPreviewCollapsed) {
    previewPane.classList.add('collapsed');
    togglePreviewBtn.classList.remove('active');
    // 如果编辑栏也折叠了，自动展开编辑栏
    if (isEditorCollapsed) {
      isEditorCollapsed = false;
      editorPane.classList.remove('collapsed');
      toggleEditorBtn.classList.add('active');
    }
  } else {
    previewPane.classList.remove('collapsed');
    togglePreviewBtn.classList.add('active');
  }
  updateResizer();
});

// 更新分隔线显示状态
function updateResizer() {
  if (isEditorCollapsed || isPreviewCollapsed) {
    resizer.style.display = 'none';
  } else {
    resizer.style.display = 'block';
  }
}

// 拖拽调整宽度
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
  if (isEditorCollapsed || isPreviewCollapsed) return;
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const container = document.querySelector('.main-container');
  const containerRect = container.getBoundingClientRect();
  const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

  if (newWidth > 10 && newWidth < 90) {
    editorPane.style.flex = `0 0 ${newWidth}%`;
    previewPane.style.flex = `0 0 ${100 - newWidth}%`;
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

// 初始按钮状态
toggleEditorBtn.classList.add('active');
togglePreviewBtn.classList.add('active');
```

---

## Task 9: 运行测试

- [ ] **Step 1: 启动应用**

Run: `npm start`
Expected: Electron 窗口打开，显示左右分栏界面，默认示例内容正确渲染

- [ ] **Step 2: 验证各功能**

| 检查项 | 预期结果 |
|--------|----------|
| 默认内容加载 | 显示欢迎文档，公式、表格、代码块正确渲染 |
| 实时预览 | 在左侧编辑，右侧实时更新 |
| 折叠编辑栏 | 点击"编辑"按钮，左侧隐藏，预览区全屏 |
| 折叠预览栏 | 点击"预览"按钮，右侧隐藏，编辑区全屏 |
| 拖拽调整 | 中间分隔线可拖拽调整左右宽度 |
| 导出 PDF | Ctrl+Shift+P 导出 PDF，内容与预览一致 |
| 导出 DOCX | Ctrl+Shift+D 导出 DOCX（需安装 pandoc）|

---

## Task 10: 可选 - 打包为可执行文件（使用 electron-builder）

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 electron-builder**

Run: `npm install --save-dev electron-builder`

- [ ] **Step 2: 添加打包脚本**

在 `package.json` 的 `scripts` 中添加：
```json
"build": "electron-builder"
```

并添加 `build` 配置：
```json
"build": {
  "appId": "com.example.markdown-editor",
  "productName": "Markdown Editor",
  "directories": {
    "output": "dist"
  },
  "files": [
    "main.js",
    "preload.js",
    "src/**/*"
  ],
  "win": {
    "target": "portable"
  }
}
```

- [ ] **Step 3: 打包**

Run: `npm run build`
Expected: 在 `dist` 目录生成可执行文件

---

## 自我审查检查清单

- [x] **Spec 覆盖**：所有需求都有对应任务（左右分栏 → Task 4/8，公式/图表 → Task 7，导出 PDF/DOCX → Task 2/7，栏位折叠 → Task 8）
- [x] **无占位符**：所有代码块都包含完整可运行代码，无 TBD/TODO
- [x] **类型一致性**：IPC 通道名称、函数签名在全文档一致
