# Changelog

本文件记录所有用户可感知的变更。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中
- 修复多标签保存退出时的内容丢失风险
- 修复 DOCX 导出并发临时文件冲突
- 预览渲染防抖与异步竞争控制
- 移除 CDN 依赖，实现完全离线可用
- 本地图片相对路径支持
- Markdown HTML 净化与 Electron 安全加固

详见 [docs/upgrade-plan.md](docs/upgrade-plan.md)。

## [1.0.2] - 2025-07-13

### 新增
- 多标签编辑与标签未保存标记
- 查找替换面板
- 编辑区与预览区独立主题切换
- 字体大小调整
- 导出 PDF / DOCX 时自动继承 Markdown 文件名
- 单实例锁定，双击 `.md` 文件在已打开窗口中新建标签
- Windows 右键「新建 → Markdown 文档」

### 修复
- 打包后 `require('./package.json')` 失效导致版本号获取失败
- DOCX 导出表格识别异常（表格前补空行、清理分隔行空白）
- DOCX 中文字体统一为宋体

## [1.0.0] - 2025-06-25

### 新增
- 首个可用版本：左右分栏实时预览
- marked + KaTeX + Mermaid + highlight.js 渲染管线
- 导出 PDF（Electron printToPDF）
- 导出 DOCX（Pandoc 转换）
- NSIS 安装包与便携版打包配置
