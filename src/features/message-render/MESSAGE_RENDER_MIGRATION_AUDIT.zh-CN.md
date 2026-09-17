# 复杂内容解析基座迁移验收记录

> 收口日期：2026-09-15  
> 参照分支：`agent-open-cloud-protal/origin/release-jdk21-001`

## 已对齐的基础能力

| 能力 | AI-flow-admin 实现 | 结论 |
| --- | --- | --- |
| SSE 内容解析 | `sseContentAdapter.ts` 统一解析正文、推理和已注册节点事件 | 已对齐 |
| 内容增量合并 | `conversationBlocks.ts` 统一维护推理、正文、图片、图表、引用和猜你想问顺序 | 已对齐 |
| renderer 注册 | `registry.ts` + `registerDefaultRenderers.ts`，避免页面内继续扩展 switch | 已对齐并收敛 |
| Markdown | GFM、表格、任务列表、代码块复制、链接、图片及异常换行修复 | 已对齐 |
| 流式性能 | 120ms 节流并记忆化 Markdown 解析树 | 已对齐 |
| HTML | DOMPurify 净化后渲染 | 已对齐 |
| 推理内容 | transient、流式展开、结束可折叠、使用 Markdown renderer | 已对齐 |
| 图片与附件外壳 | 图片放大；附件图片预览；普通附件下载 | renderer 已对齐，助手输出协议仍待后端 |
| 图表 | ECharts durable；Base64 缺省时 transient 图片降级 | 已对齐 |
| 知识库引用 | 多层事件提取、召回图片、来源卡片、分块和原文预览 | 前端已对齐 |
| 猜你想问 | transient、去重、最多三条、点击续问 | 已对齐 |
| 浮动智能助理 | 拖拽、位置记忆、紧凑/放大、历史侧栏；内部复用正式助手 | 已对齐且未复制聊天逻辑 |

## 主动保留的业务边界

- 数据库表格仍只进入节点调试。后端没有正式表格消息持久化类型，不用 transient 绕过。
- 通用助手图片与助手输出文件只有 renderer，不加入 durable 对话准入，等待后端 Schema。
- 节点状态、耗时、输入输出、日志和错误分支只属于调试体系。
- 未知 custom kind 使用安全兜底，不自动获得业务支持资格。

## 单链路约束

`runWorkflowStream` 只通过 `onContentDelta` 输出对话内容。正式助手和调试运行窗口不再分别监听正文、推理、节点富内容及辅助事件；`onNodeEvent` 仅服务节点执行状态。浮动智能助理直接嵌入正式助手，因此三个入口不存在各自解析分支。

## 验证结果

- TypeScript：`pnpm exec tsc --noEmit` 通过。
- 正式智能体助手已验证消息发送、durable 正文刷新恢复，以及 transient 推理过程刷新后消失。
- 浮动智能助理直接复用正式助手，已验证所选智能体和会话历史一致；不存在第二套消息解析与保存状态。
- 工作流调试已使用真实知识库返回验证：成功展示 2 条引用，引用卡片可打开分块并预览 XLSX 原文。
- 已修复单行压缩 Markdown 的标题/列表恢复，以及知识库引用出现后原始 JSON 正文重复展示的问题。

## 后续修改纪律

新增复杂内容时，先在生命周期 registry 声明 durable 或 transient，再增加 SSE adapter 与 renderer；durable 必须同时提供保存和历史恢复。禁止在调试窗、正式助手或浮窗内新增私有解析分支。
