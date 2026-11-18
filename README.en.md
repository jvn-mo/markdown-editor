# Markdown Editor · Lightweight Markdown writing & export tool

> A desktop Markdown editor built for one specific pain: **copying an AI answer into Word and losing every formula, table and code block.**

[简体中文](README.md) · English

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows">
  <img alt="electron" src="https://img.shields.io/badge/Electron-30-47848F?logo=electron">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green">
  <img alt="version" src="https://img.shields.io/github/v/release/jvn-mo/markdown-editor?color=blue">
  <img alt="downloads" src="https://img.shields.io/github/downloads/jvn-mo/markdown-editor/total?color=orange">
  <img alt="stars" src="https://img.shields.io/github/stars/jvn-mo/markdown-editor?style=social">
</p>

<p align="center">
  <a href="#-download">Download</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-build-from-source">Build</a> ·
  <a href="#-faq">FAQ</a> ·
  <a href="docs/upgrade-plan.md">Roadmap</a>
</p>

<!-- Screenshot: put your screenshot at docs/images/screenshot.png and uncomment the next line
![Screenshot](docs/images/screenshot.png)
-->

> 📄 **Want to see it first?** Drop [examples/showcase.md](examples/showcase.md) into the editor — it demonstrates math, tables, Mermaid diagrams and syntax highlighting, and doubles as the project's rendering regression sample.

---

## Why this exists

Paste a ChatGPT / Claude / DeepSeek answer into Microsoft Word and the maths turns into gibberish, tables collapse, and code loses its indentation. Everyone hits this daily, and the usual workaround — opening Typora or Obsidian, exporting, then re-opening Word — is five steps too many.

This tool collapses it into one:

**Markdown in → live preview → one-click export to DOCX / PDF**

Everything is processed locally. No document leaves your machine.

---

## Download

Grab the latest build from [**Releases**](../../releases/latest):

| File | Description |
|---|---|
| `Markdown-Editor-Setup-x.y.z.exe` | Installer. Creates a desktop shortcut and registers `.md` / `.markdown` file associations |
| Portable build (if published) | No installation required; unzip and run |

**Requirements:** Windows 10 / 11 (x64)

> **DOCX export requires [Pandoc](https://pandoc.org/installing.html).** Editing, preview and PDF export work with no extra dependency.

> ⚠️ The binaries are **not code-signed**, so Windows SmartScreen may warn you. Click **More info → Run anyway**. If you prefer, build it from source yourself — it takes two commands.

---

## Features

### Editing
- Split-pane live preview with a draggable divider
- Collapse either pane for distraction-free writing or reading
- **Tabs** — work on several documents at once
- Independent light/dark themes for editor and preview
- Adjustable font size
- Find & replace (next / previous / replace / replace all)
- Undo / redo, <kbd>Tab</kbd> indentation
- Status bar: file name, unsaved marker, character count

### Rendering
- Full GFM: headings, lists, tables, blockquotes, task lists, strikethrough
- **LaTeX math** — inline `$...$` and display `$$...$$`, rendered by KaTeX
- **Mermaid diagrams** — flowcharts, sequence diagrams, Gantt charts
- Syntax highlighting for 100+ languages via highlight.js
- Images, links and tables rendered faithfully

### Export
- **PDF** — matches the preview layout; good for archiving and printing
- **DOCX** — converted by Pandoc; formulas, tables, code blocks and images survive, and the East Asian font is rewritten to SimSun so Word documents look normal on Chinese systems
- Export file name is inherited from the Markdown file

### Desktop integration
- Double-click a `.md` file to open it in the app
- Single-instance: opening another file adds a tab to the running window
- Registers the Windows *"New → Markdown Document"* context-menu entry on install
- Unsaved-changes guard on tab close and window close
- No network requests — your documents stay on disk

---

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New | `Ctrl + N` |
| Open | `Ctrl + O` |
| Save | `Ctrl + S` |
| Save as | `Ctrl + Shift + S` |
| Export PDF | `Ctrl + Shift + P` |
| Export DOCX | `Ctrl + Shift + D` |
| Undo / Redo | `Ctrl + Z` / `Ctrl + Y` |
| Find / Replace | `Ctrl + F` / `Ctrl + H` |
| Increase / decrease font | `Ctrl + =` / `Ctrl + -` |

---

## Build from source

```bash
git clone https://github.com/jvn-mo/markdown-editor.git
cd markdown-editor

npm install
npm start          # development
npm run build      # package the Windows installer into dist/
```

Node.js 18+ is required. If the Electron download is slow, set a mirror first:

```bash
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) 30 |
| UI | Plain HTML / CSS / JavaScript — no framework, fast startup |
| Markdown | [marked](https://marked.js.org/) |
| Math | [KaTeX](https://katex.org/) |
| Diagrams | [Mermaid](https://mermaid.js.org/) |
| Highlighting | [highlight.js](https://highlightjs.org/) |
| DOCX export | [Pandoc](https://pandoc.org/) + adm-zip (font post-processing) |
| Packaging | electron-builder + NSIS |

Architecture notes: [docs/design.md](docs/design.md) (Chinese).

---

## FAQ

**DOCX export says pandoc was not found.**
Install Pandoc from <https://pandoc.org/installing.html>, then restart the app. `pandoc --version` in a terminal should print a version.

**Math or diagrams do not render.**
KaTeX and Mermaid are currently loaded from a CDN, so the first launch needs network access. Offline bundling is on the [roadmap](docs/upgrade-plan.md).

**Is my document uploaded anywhere?**
No. There is no upload code path; everything happens locally.

**macOS / Linux support?**
Only a Windows installer is published today. The source is cross-platform; PRs adding other build targets are welcome.

**Why is the installer ~70 MB?**
That is the Electron runtime. A future release may ship a leaner build.

---

## Roadmap

Turning a working tool into something worth using daily — see [docs/upgrade-plan.md](docs/upgrade-plan.md) (Chinese):

- [ ] Fix content-loss risk when saving multiple tabs on exit
- [ ] Concurrent DOCX export conflicts and better error messages
- [ ] Preview debouncing and async render race conditions
- [ ] Bundle all runtime libraries locally (true offline mode)
- [ ] Relative image paths and paste-image support
- [ ] HTML sanitising (DOMPurify) and Electron hardening
- [ ] Settings persistence, autosave drafts, crash recovery
- [ ] Document outline, templates, richer export options
- [ ] Migrate the editor core to CodeMirror 6

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, feature requests, doc fixes and PRs are all welcome.

If this saves you a few minutes of formatting, a ⭐ helps a solo project far more than you would think.

---

## License

[MIT](LICENSE) © 2025-2026 jvn-mo
