const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// ===== 单实例锁定 =====
// 确保只有一个应用实例运行，双击文件时把参数传给已有实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // 从命令行参数中查找 .md/.markdown 文件
      const filePath = commandLine.find(arg =>
        (arg.endsWith('.md') || arg.endsWith('.markdown')) && fs.existsSync(arg)
      );
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        mainWindow.webContents.send('file-opened', content, filePath);
      }
    }
  });
}

// 从启动参数中获取文件路径
function getFileFromArgv() {
  // 开发模式下 argv 格式不同，需跳过前两个参数
  const startIndex = process.defaultApp ? 2 : 1;
  const args = process.argv.slice(startIndex);
  const filePath = args.find(arg =>
    (arg.endsWith('.md') || arg.endsWith('.markdown')) && fs.existsSync(arg)
  );
  return filePath;
}

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

  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
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
              mainWindow.webContents.send('file-opened', content, result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'Ctrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        {
          label: '另存为',
          accelerator: 'Ctrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-save-as');
          }
        },
        { type: 'separator' },
        {
          label: '导出 PDF',
          accelerator: 'Ctrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('export-pdf');
          }
        },
        {
          label: '导出 DOCX',
          accelerator: 'Ctrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('export-docx');
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'Ctrl+Z',
          click: () => {
            mainWindow.webContents.send('menu-undo');
          }
        },
        {
          label: '重做',
          accelerator: 'Ctrl+Y',
          click: () => {
            mainWindow.webContents.send('menu-redo');
          }
        },
        { type: 'separator' },
        {
          label: '查找',
          accelerator: 'Ctrl+F',
          click: () => {
            mainWindow.webContents.send('menu-find');
          }
        },
        {
          label: '替换',
          accelerator: 'Ctrl+H',
          click: () => {
            mainWindow.webContents.send('menu-replace');
          }
        }
      ]
    },
    {
      label: '格式',
      submenu: [
        {
          label: '刷新渲染',
          click: () => {
            mainWindow.webContents.send('menu-refresh');
          }
        },
        { type: 'separator' },
        {
          label: '增大字体',
          accelerator: 'Ctrl+=',
          click: () => {
            mainWindow.webContents.send('menu-font-increase');
          }
        },
        {
          label: '减小字体',
          accelerator: 'Ctrl+-',
          click: () => {
            mainWindow.webContents.send('menu-font-decrease');
          }
        },
        { type: 'separator' },
        {
          label: '编辑器主题',
          submenu: [
            {
              label: '暗色',
              type: 'radio',
              checked: true,
              click: () => {
                mainWindow.webContents.send('menu-editor-theme', 'dark');
              }
            },
            {
              label: '亮色',
              type: 'radio',
              checked: false,
              click: () => {
                mainWindow.webContents.send('menu-editor-theme', 'light');
              }
            }
          ]
        },
        {
          label: '预览主题',
          submenu: [
            {
              label: '亮色',
              type: 'radio',
              checked: true,
              click: () => {
                mainWindow.webContents.send('menu-preview-theme', 'light');
              }
            },
            {
              label: '暗色',
              type: 'radio',
              checked: false,
              click: () => {
                mainWindow.webContents.send('menu-preview-theme', 'dark');
              }
            }
          ]
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // ===== 关闭前检查未保存 =====
  mainWindow.on('close', async (e) => {
    if (isQuitting) return;
    e.preventDefault();
    mainWindow.webContents.send('check-unsaved');
  });
}

let isQuitting = false;

app.whenReady().then(() => {
  createWindow();

  // 检查启动参数中是否有文件路径
  const filePath = getFileFromArgv();
  if (filePath) {
    // 等待窗口加载完成后再发送文件内容
    mainWindow.webContents.on('did-finish-load', () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow.webContents.send('file-opened', content, filePath);
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 提供版本号查询（打包后 preload 中 require package.json 可能失效）
ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

// 处理保存请求
ipcMain.handle('save-file', async (event, content, filePath) => {
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  }
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
ipcMain.handle('export-pdf', async (event, htmlContent, theme, defaultFileName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFileName || 'export.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!result.canceled) {
    const pdfWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: { contextIsolation: true }
    });

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1e1e1e' : '#ffffff';
    const textColor = isDark ? '#d4d4d4' : '#333333';
    const headingColor = isDark ? '#e0e0e0' : '#222222';
    const codeBg = isDark ? '#2a2a2a' : '#f5f5f5';
    const borderColor = isDark ? '#444444' : '#dddddd';
    const blockquoteBg = isDark ? '#2a2a2a' : '#f9f9f9';
    const blockquoteBorder = isDark ? '#555555' : '#dddddd';
    const blockquoteColor = isDark ? '#aaaaaa' : '#555555';
    const thBg = isDark ? '#2a2a2a' : '#f5f5f5';
    const trEvenBg = isDark ? '#252525' : '#fafafa';
    const inlineCodeBg = isDark ? '#333333' : '#f0f0f0';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          body {
            font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
            padding: 40px;
            line-height: 1.6;
            background: ${bgColor};
            color: ${textColor};
          }
          h1, h2, h3, h4, h5, h6 { color: ${headingColor}; }
          pre { background: ${codeBg}; padding: 12px; border-radius: 4px; overflow-x: auto; }
          code { font-family: Consolas, monospace; background: ${inlineCodeBg}; padding: 2px 6px; border-radius: 3px; }
          blockquote { border-left: 4px solid ${blockquoteBorder}; margin: 0; padding-left: 16px; background: ${blockquoteBg}; color: ${blockquoteColor}; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid ${borderColor}; padding: 8px; text-align: left; }
          th { background: ${thBg}; }
          tr:nth-child(even) { background: ${trEvenBg}; }
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

// 处理 DOCX 导出
ipcMain.handle('export-docx', async (event, markdownContent, defaultFileName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFileName || 'export.docx',
    filters: [{ name: 'Word Document', extensions: ['docx'] }]
  });
  if (!result.canceled) {
    // 规范化换行符（统一为 \n，处理 \r\n 和旧 Mac 的 \r）
    markdownContent = markdownContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 在表格块前插入空行（pandoc 要求表格前必须有空行）
    const lines = markdownContent.split('\n');
    const resultLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = /^\s*\|/.test(line);
      const prevLine = resultLines.length > 0 ? resultLines[resultLines.length - 1] : null;
      const prevIsTable = prevLine !== null && /^\s*\|/.test(prevLine);
      const prevIsEmpty = prevLine === null || prevLine.trim() === '';
      if (isTableLine && !prevIsTable && !prevIsEmpty) {
        resultLines.push('');
      }
      resultLines.push(line);
    }
    markdownContent = resultLines.join('\n');

    // 清理表格分隔符行中的所有空白字符，确保 pandoc 正确识别表格
    markdownContent = markdownContent.replace(/^\s*\|(?:\s*-+\s*\|)+\s*$/gm, (line) => {
      return line.replace(/[^|\-]/g, '');
    });

    const tempMd = path.join(app.getPath('temp'), 'temp_export.md');
    fs.writeFileSync(tempMd, markdownContent, 'utf-8');

    const { exec } = require('child_process');
    const pandocCmd = `pandoc "${tempMd}" -o "${result.filePath}" --from markdown+tex_math_single_backslash+pipe_tables+hard_line_breaks --to docx`;

    return new Promise((resolve) => {
      exec(pandocCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Pandoc error:', error);
          resolve({ success: false, error: 'pandoc not found. Please install pandoc: https://pandoc.org/installing.html' });
        } else {
          // 将默认字体修改为宋体
          try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(result.filePath);
            const stylesEntry = zip.getEntry('word/styles.xml');
            if (stylesEntry) {
              let stylesXml = zip.readAsText(stylesEntry);
              // 只替换中文字体为宋体，保留西文/等宽字体
              stylesXml = stylesXml.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="SimSun"');
              // 同时替换 docDefaults 中的默认字体
              stylesXml = stylesXml.replace(/<w:rFonts\s+([^>]*)w:eastAsia="[^"]*"([^>]*)\/>/g, (match, p1, p2) => {
                return `<w:rFonts ${p1}w:eastAsia="SimSun"${p2}/>`;
              });
              zip.updateFile('word/styles.xml', Buffer.from(stylesXml, 'utf-8'));
              zip.writeZip(result.filePath);
            }
          } catch (fontErr) {
            console.error('Fix docx font error:', fontErr);
          }
          resolve({ success: true, path: result.filePath });
        }
      });
    });
  }
  return { success: false };
});

// 关闭前检查未保存的 IPC 处理
ipcMain.on('unsaved-result', async (event, hasUnsaved) => {
  if (!hasUnsaved) {
    isQuitting = true;
    mainWindow.close();
    return;
  }

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    cancelId: 2,
    title: '未保存的更改',
    message: '有未保存的更改，是否保存？'
  });

  if (result.response === 0) {
    // 保存
    mainWindow.webContents.send('save-all-and-quit');
  } else if (result.response === 1) {
    // 不保存
    isQuitting = true;
    mainWindow.close();
  }
  // 取消：什么都不做，窗口保持打开
});

ipcMain.on('save-all-complete', () => {
  isQuitting = true;
  mainWindow.close();
});

// 关闭单个标签前确认
ipcMain.handle('confirm-close-tab', async (event, fileName) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    cancelId: 2,
    title: '未保存的更改',
    message: `"${fileName}" 有未保存的更改，是否保存？`
  });
  return { action: result.response };
});
