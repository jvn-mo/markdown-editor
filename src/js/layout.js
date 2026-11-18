const editorPane = document.getElementById('editor-pane');
const previewPane = document.getElementById('preview-pane');
const resizer = document.getElementById('resizer');
const toggleEditorBtn = document.getElementById('toggle-editor');
const togglePreviewBtn = document.getElementById('toggle-preview');

let isEditorCollapsed = false;
let isPreviewCollapsed = false;

// 点击"编辑"按钮 → 编辑区全屏（预览折叠），再次点击恢复双栏
toggleEditorBtn.addEventListener('click', () => {
  if (isPreviewCollapsed) {
    // 当前已经是仅编辑模式，恢复双栏
    isPreviewCollapsed = false;
    previewPane.classList.remove('collapsed');
    togglePreviewBtn.classList.add('active');
  } else {
    // 进入仅编辑模式：折叠预览
    isPreviewCollapsed = true;
    previewPane.classList.add('collapsed');
    togglePreviewBtn.classList.remove('active');

    // 确保编辑区展开
    isEditorCollapsed = false;
    editorPane.classList.remove('collapsed');
    toggleEditorBtn.classList.add('active');
  }
  updateResizer();
});

// 点击"预览"按钮 → 预览区全屏（编辑折叠），再次点击恢复双栏
togglePreviewBtn.addEventListener('click', () => {
  if (isEditorCollapsed) {
    // 当前已经是仅预览模式，恢复双栏
    isEditorCollapsed = false;
    editorPane.classList.remove('collapsed');
    toggleEditorBtn.classList.add('active');
  } else {
    // 进入仅预览模式：折叠编辑
    isEditorCollapsed = true;
    editorPane.classList.add('collapsed');
    toggleEditorBtn.classList.remove('active');

    // 确保预览区展开
    isPreviewCollapsed = false;
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
