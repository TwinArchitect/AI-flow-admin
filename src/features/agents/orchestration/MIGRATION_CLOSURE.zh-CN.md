# 对话式编排迁移收尾核查

日期：2026-09-30。参照源码：`agent-open-cloud-protal/src`。

## 范围与结论

本期范围为对话式编排功能迁移，以及正式助手、对话式调试、流程式调试、浮窗助手共用复杂流解析运行基座。
按用户后续要求，两种编排页均提供当前智能体的流量监控、发布渠道按钮；独立路由和侧栏入口已移除。
本轮源码对照发现的遗漏已补齐，静态检查通过。此记录不代表全部业务场景已通过真实接口验收。

## 源码核查清单

| 能力 | 实现位置与状态 |
| --- | --- |
| 创建对话式智能体、读取编辑保存 | MyAgentsPage、ChatAgentOrchestrationPage；创建时从模型接口选择可用规划模型 |
| 头像、人设、简介及 AI 优化 | ChatAgentAvatarPicker、ChatAgentOrchestrationPage |
| 开场白、3～10 个问题、AI 生成 | ChatAgentOrchestrationPage、agentApi；使用 opening_questions 场景 |
| 规划模型、工具轮数、调用策略、温度、Token | chatAgentConfig、ChatAgentOrchestrationPage；模型来自接口 |
| 知识库检索策略与参数 | 配置读写及 DatasetSearchParamsDialog |
| HTTP、MCP、已发布工作流绑定 | skillResourceApi、chatAgentConfig；MCP 支持 enabledToolNames |
| 长短期记忆 | chatAgentConfig 与配置页 |
| 调试开场问题、附件、语音、停止、清空、重新生成 | 配置页及 speech；上传图片预处理、输入框自动增高已迁入 |
| 调试生命周期 | 离开或切换智能体时中止；丢弃旧附件上传结果；版本恢复后清理调试 |
| 配置 JSON、YAML DSL 导入导出 | 配置页与 agentApi；DSL 通过服务端接口 |
| 发布、发布历史、版本恢复 | agentApi 与配置页 |
| 流量监控 | AgentTrafficMonitor、agentMonitorApi；累计指标、7/14/30 天、五类趋势、刷新、CSV |
| 发布渠道 | AgentPublishChannelPanel；单/多智能体 iframe、API 密钥管理、API 与附件文档复制下载 |
| Skills 技能包 | 与参照项目一致保留“即将推出”，不作为已实现工具能力 |

## 四个入口的共同链路

正式助手与对话式调试直接调用 runConversationTurn；流程调试通过 useWorkflowRuntime 调用相同函数；浮窗直接复用正式助手。
runConversationTurn 统一调用 runWorkflowStream，并使用 SSE adapter、applyConversationDelta、ExecutionTraceMonitor、finalizeConversationRun。
正文、推理、引用、图表、猜你想问使用公共 ConversationMessageContent；工具和模型请求监控使用公共 ChatPreviewToolMonitor。
原前端 60 秒流空闲超时已移除。非流式管理接口的超时不在本次移除范围。
后端未发送 tool_status/model_request/question_guide 时，前端不会伪造这些内容；此前用户已确认跳过相应接口验收。

## 改动边界

WorkflowCanvas.tsx 仅新增 AgentOperationsButtons 的 import 与工具栏引用。
当前 diff 未修改 workflows/nodes、画布 store、workflowSerialization、connectionRules。
工作流运行相关改动仅用于共用对话解析链路。
KnowledgeBasePage.tsx 的既有改动不属于本轮收尾。

## 静态检查

- pnpm type-check：通过。
- git diff --check：通过。
- 没有进行浏览器实测，遵循用户本轮要求。

## 实测缺口

后续需验证：DSL 导入导出闭环与下载，发布与版本恢复，真实 HTTP/MCP/工作流技能调用，记忆效果，语音及附件处理，渠道嵌入与 API 密钥操作，以及四个入口对同类真实流事件的展示。
此前已验证创建/保存/重开回显及监控真实数据和日期范围切换；本轮新增项不自动继承此前验收结果。

## 2026-10-14 iframe 补充

此前渠道只有 iframe 示例，缺少实际嵌入入口，原收尾判断不包含该遗漏。
现已补迁 `/embed/assistant`、URL Token/租户初始化、智能体锁定、iframe 自动打开/隐藏 FAB、全页模式、移动端拍照与宿主关闭通知。
接入方式见 overview/IFRAME_EMBED.zh-CN.md；浏览器和跨域实测仍待验收。
