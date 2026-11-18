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

// 字体大小
let previewFontSize = 15;
let editorFontSize = 14;

// 当前主题
let currentTheme = 'light';

// ===== 公式保护机制 =====
let mathPlaceholders = [];

function protectMath(text) {
  mathPlaceholders = [];
  let counter = 0;

  // 1. 保护 $$...$$ 块级公式（最优先，避免被 $ 正则误匹配）
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const id = `MATHBLOCK_${counter++}`;
    mathPlaceholders.push({ id, formula: formula.trim(), type: 'block' });
    return `<!--${id}-->`;
  });

  // 2. 保护 \[...\] 块级公式
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    const id = `MATHBLOCK_${counter++}`;
    mathPlaceholders.push({ id, formula: formula.trim(), type: 'block' });
    return `<!--${id}-->`;
  });

  // 3. 保护 \(...\) 行内公式
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    const id = `MATHINLINE_${counter++}`;
    mathPlaceholders.push({ id, formula: formula.trim(), type: 'inline' });
    return `<!--${id}-->`;
  });

  // 4. 保护 $...$ 行内公式（贪婪最小匹配，排除连续$和转义\$）
  text = text.replace(/(?<![$\\])\$(?!\$)([\s\S]+?)(?<![$\\])\$(?!\$)/g, (match, formula) => {
    const id = `MATHINLINE_${counter++}`;
    mathPlaceholders.push({ id, formula: formula.trim(), type: 'inline' });
    return `<!--${id}-->`;
  });

  return text;
}

function renderMathPlaceholders(html) {
  if (!window.katex || !window.katex.renderToString) {
    for (const { id, formula, type } of mathPlaceholders) {
      const placeholder = `<!--${id}-->`;
      const fallback = type === 'block' ? `$$${formula}$$` : `$${formula}$`;
      html = html.split(placeholder).join(fallback);
    }
    return html;
  }

  for (const { id, formula, type } of mathPlaceholders) {
    const placeholder = `<!--${id}-->`;
    if (!html.includes(placeholder)) continue;

    try {
      const rendered = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: type === 'block'
      });
      html = html.split(placeholder).join(rendered);
    } catch (e) {
      const fallback = type === 'block' ? `$$${formula}$$` : `$${formula}$`;
      html = html.split(placeholder).join(fallback);
    }
  }
  return html;
}

// 渲染内容
async function renderContent(markdown) {
  let protectedMd = protectMath(markdown);
  let html = marked.parse(protectedMd);
  html = renderMathPlaceholders(html);

  previewEl.innerHTML = html;

  previewEl.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });

  if (window.mermaid) {
    try {
      await mermaid.run({ querySelector: '.mermaid' });
    } catch (e) {
      // 忽略 mermaid 错误
    }
  }
}

// 监听内容变化
previewEl.addEventListener('contentchange', (e) => {
  renderContent(e.detail.content);
});

// 初始化 Mermaid
mermaid.initialize({ startOnLoad: false });

// 刷新渲染
function refreshPreview() {
  const markdown = document.getElementById('editor').value;
  renderContent(markdown);
}

// 调整预览字体
function adjustPreviewFontSize(delta) {
  previewFontSize = Math.max(10, Math.min(32, previewFontSize + delta));
  previewEl.style.fontSize = previewFontSize + 'px';
}

// 调整编辑器字体
function adjustEditorFontSize(delta) {
  editorFontSize = Math.max(10, Math.min(32, editorFontSize + delta));
  document.getElementById('editor').style.fontSize = editorFontSize + 'px';
}

// ===== 独立主题管理 =====
function setEditorTheme(theme) {
  document.body.setAttribute('data-editor-theme', theme);
}

function setPreviewTheme(theme) {
  document.body.setAttribute('data-preview-theme', theme);
}

function setGlobalTheme(theme) {
  // 兼容旧版菜单：同时设置两者
  setEditorTheme(theme);
  setPreviewTheme(theme);
}

// 初始化主题
setEditorTheme('dark');
setPreviewTheme('light');

// ===== IPC 事件 =====
if (window.electronAPI) {
  window.electronAPI.onMenuRefresh(() => {
    refreshPreview();
  });

  window.electronAPI.onMenuFontIncrease(() => {
    adjustPreviewFontSize(1);
    adjustEditorFontSize(1);
  });

  window.electronAPI.onMenuFontDecrease(() => {
    adjustPreviewFontSize(-1);
    adjustEditorFontSize(-1);
  });

  // 兼容旧版菜单主题切换（同时影响两者）
  window.electronAPI.onMenuTheme((theme) => {
    setGlobalTheme(theme);
  });

  // 独立主题切换
  window.electronAPI.onMenuEditorTheme((theme) => {
    setEditorTheme(theme);
  });

  window.electronAPI.onMenuPreviewTheme((theme) => {
    setPreviewTheme(theme);
  });
}
