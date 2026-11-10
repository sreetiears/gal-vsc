# ADR 0001: Panel Webview，而非编辑器浮层

## Status

Accepted

## Context

产品希望大肥鱼像 DSH `whale-widget` 一样停在「右下角并可拖动」。VS Code / Cursor 扩展 API **不能**把 Webview 叠在编辑器文本之上；注入 `workbench.html` 属于不受支持路径，在 Cursor 上更易损坏。

## Decision

使用底部 Panel 的 `WebviewView`。角色在面板内部默认右下角、可拖动与边缘吸附。Status bar 显示好感/陪伴摘要。

## Consequences

- 可上架、可维护、F5 开发路径清晰。
- 宠物不会盖住代码；需要用户打开「大肥鱼」面板才能看到角色。
- 若未来官方提供浮层 API，可再评估迁移，而不阻塞 demo。
