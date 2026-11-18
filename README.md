# Markdown Editor · 轻量级 Markdown 写作与导出工具

> 一个为「从 AI 复制内容 → 排版 → 导出 Word/PDF」而生的桌面 Markdown 编辑器。
> 公式、表格、代码块、Mermaid 图表所见即所得，导出不再乱码。

[English](README.en.md) · 简体中文

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows">
  <img alt="electron" src="https://img.shields.io/badge/Electron-30-47848F?logo=electron">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green">
  <img alt="version" src="https://img.shields.io/github/v/release/jvn-mo/markdown-editor?color=blue">
  <img alt="downloads" src="https://img.shields.io/github/downloads/jvn-mo/markdown-editor/total?color=orange">
  <img alt="stars" src="https://img.shields.io/github/stars/jvn-mo/markdown-editor?style=social">
</p>

<p align="center">
  <a href="#-下载安装">下载安装</a> ·
  <a href="#-功能特性">功能特性</a> ·
  <a href="#-从源码运行">从源码运行</a> ·
  <a href="#-常见问题">常见问题</a> ·
  <a href="docs/upgrade-plan.md">路线图</a>
</p>

<!-- 截图：界面图放到 docs/images/screenshot.png 后，取消下一行注释
![界面预览](docs/images/screenshot.png)
-->

> 📄 **想先看看效果？** 把 [examples/showcase.md](examples/showcase.md) 拖进编辑器，就能看到公式、表格、Mermaid 图表、代码高亮的完整渲染。它同时也是项目的**渲染回归自检样例**。

---

## ✨ 为什么做这个项目

把 ChatGPT / Claude / DeepSeek 生成的 Markdown 答案直接粘贴进 Word，公式变乱码、表格散架、代码块失去缩进 —— 这是很多人每天都会遇到的麻烦。

这个工具把这条链路做通了：

**AI 对话 → 粘贴 Markdown → 实时预览 → 一键导出 DOCX / PDF**

全程本地处理，不联网、不上传文档、不留痕迹。

---

## 📦 下载安装

前往 [**Releases**](../../releases/latest) 下载最新版本：

| 文件 | 说明 |
|---|---|
| `Markdown-Editor-Setup-x.y.z.exe` | 安装版，自动创建桌面快捷方式，关联 `.md` / `.markdown` 文件 |
| `*.exe`（Portable 便携版） | 免安装，解压即用，适合放 U 盘或拷到其他电脑 |

系统要求：**Windows 10 / 11（64 位）**

> 导出 DOCX 需要额外安装 [Pandoc](https://pandoc.org/installing.html)。
> 仅编辑、预览、导出 PDF 则无需任何额外依赖。
> 详细图文步骤见 [用户使用说明](用户使用说明.md)。

---

## 🚀 功能特性

### 编辑与预览

- **左右分栏实时预览**，中间分隔线可拖拽调整比例
- 任意一侧可一键折叠，专注写作或专注阅读
- **多标签页**编辑，同时打开多个文档
- 编辑区 / 预览区主题独立切换（暗色 / 亮色）
- 字号可调，长文阅读更舒服
- 查找替换面板，支持上/下一个、替换、全部替换
- 撤销 / 重做、Tab 缩进
- 状态栏显示文件名、未保存状态、字数

### Markdown 渲染

- 完整 GFM 支持：标题、列表、表格、引用、代码块、任务列表、删除线
- **LaTeX 数学公式**（行内 `$...$` 与块级 `$$...$$`），由 KaTeX 渲染
- **Mermaid 图表**：流程图、时序图、甘特图等
- 代码块语法高亮（highlight.js，支持上百种语言）
- 表格、图片、链接完整渲染

### 导出

- **导出 PDF**：与预览一致的排版，适合归档、打印、交作业
- **导出 DOCX**：经 Pandoc 转换，保留公式、表格、代码块、图片；自动将中文字体设置为宋体，打开即是规范的 Word 文档
- 导出时自动继承 Markdown 文件名

### 桌面集成

- 双击 `.md` 文件直接用本应用打开
- 单实例运行：再次双击文件会在已打开的窗口中新开标签
- 安装时注册 Windows 右键「新建 → Markdown 文档」
- 关闭前检测未保存内容，提供「保存 / 不保存 / 取消」三选一
- 无网络请求，文档不出本机

---

## ⌨️ 快捷键

| 操作 | 快捷键 |
|---|---|
| 新建 | `Ctrl + N` |
| 打开 | `Ctrl + O` |
| 保存 | `Ctrl + S` |
| 另存为 | `Ctrl + Shift + S` |
| 导出 PDF | `Ctrl + Shift + P` |
| 导出 DOCX | `Ctrl + Shift + D` |
| 撤销 / 重做 | `Ctrl + Z` / `Ctrl + Y` |
| 查找 / 替换 | `Ctrl + F` / `Ctrl + H` |
| 放大 / 缩小字号 | `Ctrl + =` / `Ctrl + -` |

---

## 🛠 从源码运行

```bash
# 1. 准备环境：Node.js >= 18
node -v

# 2. 克隆仓库
git clone https://github.com/jvn-mo/markdown-editor.git
cd markdown-editor

# 3. 安装依赖（Electron 下载较慢时建议配置国内镜像）
npm install

# 4. 启动开发模式
npm start

# 5. 打包 Windows 安装程序
npm run build
```

打包产物输出到 `dist/`。

> 若 `npm install` 下载 Electron 缓慢，可先执行：
> `npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/`

---

## 🧱 技术栈

| 层 | 选型 |
|---|---|
| 桌面框架 | [Electron](https://www.electronjs.org/) 30 |
| 界面 | 原生 HTML / CSS / JavaScript（无框架，启动快） |
| Markdown | [marked](https://marked.js.org/) |
| 数学公式 | [KaTeX](https://katex.org/) |
| 图表 | [Mermaid](https://mermaid.js.org/) |
| 代码高亮 | [highlight.js](https://highlightjs.org/) |
| DOCX 导出 | [Pandoc](https://pandoc.org/) + adm-zip（字体后处理） |
| 打包 | electron-builder + NSIS |

架构说明见 [docs/design.md](docs/design.md)。

---

## ❓ 常见问题

**Q：导出 DOCX 提示找不到 pandoc？**
A：需先安装 Pandoc：<https://pandoc.org/installing.html>。安装后重启应用。命令行执行 `pandoc --version` 能显示版本号即为成功。

**Q：公式或图表显示不出来？**
A：公式与图表渲染依赖 CDN 资源，首次使用需联网加载。离线场景支持已在路线图中（见 [升级计划](docs/upgrade-plan.md)）。

**Q：导出的 Word 里中文不是宋体？**
A：导出时已自动将 `w:eastAsia` 字体替换为 SimSun，若系统缺少该字体会回退到其他字体。

**Q：支持 macOS / Linux 吗？**
A：目前仅提供 Windows 安装包。源码层面跨平台可运行，欢迎提交 PR 补充其他平台构建。

**Q：会不会把我的文档上传到服务器？**
A：不会。应用无网络上传逻辑，全部在本地处理。

---

## 🗺 路线图

正在从「能用的工具」升级为「值得长期使用的写作软件」，详见 **[docs/upgrade-plan.md](docs/upgrade-plan.md)**：

- [ ] 修复多标签保存退出时的内容丢失风险
- [ ] DOCX 导出并发冲突与错误提示
- [ ] 预览防抖与异步渲染竞争
- [ ] 离线化：移除 CDN 依赖，运行时库本地打包
- [ ] 本地图片相对路径支持
- [ ] 文档净化（DOMPurify）与 Electron 安全加固
- [ ] 设置持久化、自动草稿与崩溃恢复
- [ ] 文档大纲、模板、导出选项增强
- [ ] 编辑器内核迁移 CodeMirror 6

欢迎在 [Issues](../../issues) 提出需求，或直接提交 PR。

---

## 🤝 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。无论是报 Bug、提需求、改文档还是提交代码，都非常欢迎。

如果这个工具帮你省下了排版的时间，欢迎点一个 **Star** ⭐ —— 这是对个人项目最实在的鼓励。

---

## 📄 许可证

[MIT](LICENSE) © 2025-2026 jvn-mo
