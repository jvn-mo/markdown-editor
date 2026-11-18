// 生成 README 界面截图：用 Electron 无交互加载主界面并截图
// 用法：node_modules\.bin\electron scripts/capture-screenshot.js [demoMd] [outPng]
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const demoPath = process.argv[2] || path.join(root, 'examples', 'showcase.md');
const outPath = process.argv[3] || path.join(root, 'docs', 'images', 'screenshot.png');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    show: true,
    backgroundColor: '#1e1e1e',
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });

  await win.loadFile(path.join(root, 'src', 'index.html'));
  await new Promise((r) => setTimeout(r, 3500));

  if (fs.existsSync(demoPath)) {
    const md = fs.readFileSync(demoPath, 'utf8');
    await win.webContents.executeJavaScript(
      '(function(){var ed=document.getElementById("editor");ed.value=' + JSON.stringify(md) +
      ';ed.dispatchEvent(new Event("input",{bubbles:true}));return true;})()'
    );
  }

  await new Promise((r) => setTimeout(r, 5000));

  const img = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, img.toPNG());
  const size = img.getSize();
  console.log('saved:', outPath, size.width + 'x' + size.height);
  win.destroy();
  app.quit();
}).catch((e) => {
  console.error('capture failed:', e && e.stack || e);
  app.exit(1);
});
