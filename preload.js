const { contextBridge, ipcRenderer } = require('electron');

// 通过 IPC 从主进程获取版本号（打包后 require('./package.json') 可能失效）
let appVersion = '1.0.2';
try {
  appVersion = ipcRenderer.sendSync('get-app-version');
} catch (e) {
  console.error('Get version error:', e);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, content, path) => callback(content, path)),
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
  saveFile: (content, filePath) => ipcRenderer.invoke('save-file', content, filePath),

  // 编辑
  onMenuUndo: (callback) => ipcRenderer.on('menu-undo', callback),
  onMenuRedo: (callback) => ipcRenderer.on('menu-redo', callback),
  onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
  onMenuReplace: (callback) => ipcRenderer.on('menu-replace', callback),

  // 格式
  onMenuRefresh: (callback) => ipcRenderer.on('menu-refresh', callback),
  onMenuFontIncrease: (callback) => ipcRenderer.on('menu-font-increase', callback),
  onMenuFontDecrease: (callback) => ipcRenderer.on('menu-font-decrease', callback),
  onMenuTheme: (callback) => ipcRenderer.on('menu-theme', (event, theme) => callback(theme)),
  onMenuEditorTheme: (callback) => ipcRenderer.on('menu-editor-theme', (event, theme) => callback(theme)),
  onMenuPreviewTheme: (callback) => ipcRenderer.on('menu-preview-theme', (event, theme) => callback(theme)),

  // 导出
  onExportPdf: (callback) => ipcRenderer.on('export-pdf', callback),
  onExportDocx: (callback) => ipcRenderer.on('export-docx', callback),
  exportPdf: (htmlContent, theme, defaultFileName) => ipcRenderer.invoke('export-pdf', htmlContent, theme, defaultFileName),
  exportDocx: (markdownContent, defaultFileName) => ipcRenderer.invoke('export-docx', markdownContent, defaultFileName),

  // 关闭前检查未保存
  onCheckUnsaved: (callback) => ipcRenderer.on('check-unsaved', callback),
  sendUnsavedResult: (hasUnsaved) => ipcRenderer.send('unsaved-result', hasUnsaved),
  onSaveAllAndQuit: (callback) => ipcRenderer.on('save-all-and-quit', callback),
  sendSaveAllComplete: () => ipcRenderer.send('save-all-complete'),

  // 关闭标签确认
  confirmCloseTab: (fileName) => ipcRenderer.invoke('confirm-close-tab', fileName),

  // 版本号
  appVersion: appVersion
});
