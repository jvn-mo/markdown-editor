; NSIS 自定义安装脚本
; 添加右键"新建"菜单中的 Markdown 文件选项

!macro customInstall
  ; 为 .md 扩展名添加右键"新建"菜单
  WriteRegStr HKCR ".md\ShellNew" "NullFile" ""
  ; 为 .markdown 扩展名添加右键"新建"菜单
  WriteRegStr HKCR ".markdown\ShellNew" "NullFile" ""
!macroend

!macro customUnInstall
  ; 卸载时删除右键"新建"菜单
  DeleteRegKey HKCR ".md\ShellNew"
  DeleteRegKey HKCR ".markdown\ShellNew"
!macroend
