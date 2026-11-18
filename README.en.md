# Markdown Editor

> A lightweight desktop Markdown editor built for "paste from AI chat → preview → export to Word/PDF".

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows">
  <img alt="electron" src="https://img.shields.io/badge/Electron-30-47848F?logo=electron">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green">
</p>

[中文说明](README.md)

## Why

Copying a Markdown answer from ChatGPT/Claude into Microsoft Word usually destroys formulas, tables and code blocks. This tool makes the whole pipeline work locally:

**Markdown in → live preview → one-click export to DOCX / PDF.**

No network calls, no document upload, everything runs on your machine.

## Features

- Split-pane live preview with a draggable divider
- Multiple tabs, independent light/dark themes for editor and preview
- LaTeX math (KaTeX), Mermaid diagrams, syntax highlighting (highlight.js)
- Full GFM: headings, lists, tables, blockquotes, task lists, strikethrough
- Export to **PDF** (print-ready) and **DOCX** (via Pandoc, Chinese font auto-set to SimSun)
- Find & replace, undo/redo, adjustable font size
- Windows file association for `.md` / `.markdown` and single-instance handling
- Unsaved-changes guard before closing

## Requirements

- Windows 10 / 11 (x64)
- [Pandoc](https://pandoc.org/installing.html) — only needed for DOCX export

## Download

Grab the latest installer from the [Releases](../../releases/latest) page.

## Build from source

```bash
git clone https://github.com/jvn-mo/markdown-editor.git
cd markdown-editor
npm install
npm start        # development
npm run build    # package Windows installer into dist/
```

## Tech stack

Electron 30 · vanilla HTML/CSS/JS · marked · KaTeX · Mermaid · highlight.js · Pandoc · electron-builder

## Roadmap

See [docs/upgrade-plan.md](docs/upgrade-plan.md) (Chinese). Planned work includes offline asset bundling, HTML sanitising, crash recovery, local image support, and a CodeMirror 6 editor core.

## License

[MIT](LICENSE)
