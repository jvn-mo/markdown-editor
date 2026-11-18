# 参与贡献

感谢你愿意改进这个项目！以下是最省事的参与方式。

## 报告问题

提交 [Issue](../../issues/new) 时请附上：

1. 应用版本（工具栏右侧显示，如 `v1.0.2`）
2. Windows 版本
3. 复现步骤（第几步出现了什么问题）
4. 期望结果与实际结果
5. 如果与渲染相关，请提供可复现的最小 Markdown 片段

## 提交代码

```bash
# 1. Fork 并克隆
git clone https://github.com/<your-name>/markdown-editor.git
cd markdown-editor

# 2. 从 main 切出分支，命名示例：
#    fix/docx-export-conflict
#    feat/offline-assets
#    docs/readme-screenshot
git checkout -b fix/your-change

# 3. 安装依赖并本地验证
npm install
npm start

# 4. 提交（建议遵循 Conventional Commits）
git commit -m "fix: 修复连续导出 DOCX 时临时文件互相覆盖"

# 5. 推送到你的 Fork 并发起 Pull Request
git push origin fix/your-change
```

## 代码约定

- 纯前端逻辑保持无框架、无构建步骤，直接可读可改
- 主进程职责：窗口、菜单、文件读写、导出；渲染进程只通过 `preload.js` 暴露的 API 与主进程通信
- 不要引入 `nodeIntegration: true`，不要削弱 `contextIsolation`
- 提交前请手动回归：新建 / 打开 / 保存 / 多标签关闭 / 导出 PDF / 导出 DOCX

## 提交前自检清单

- [ ] 应用能正常 `npm start` 启动
- [ ] 变更涉及的功能手动验证通过
- [ ] 未提交 `node_modules/`、`dist/` 等构建产物
- [ ] 如有用户可感知的变更，已更新 `CHANGELOG.md`
