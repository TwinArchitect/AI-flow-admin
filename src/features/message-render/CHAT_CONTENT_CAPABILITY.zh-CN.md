# 对话内容能力与迁移台账

> 建立时间：2026-08-24  
> 适用入口：工作流编辑页的“运行对话窗口”与“智能体助手”正式会话。  
> 不在本台账范围：节点卡片运行状态、节点输入输出、耗时、日志、命中分支和节点错误详情；这些属于独立的工作流调试体系，不属于对话消息。

## 1. 为什么建立本台账

参照项目同时存在完整功能、仅实时可用的实验功能、只有渲染组件的外壳，以及节点能执行但没有正式消息协议的能力。如果只根据页面上“能显示”判断是否完成，会混淆以下状态：

- 参照项目前端是否真正实现；
- 现有后端是否能在运行时返回；
- 现有后端是否能保存为历史消息；
- AI-flow-admin 是否已经迁移；
- 实时运行和刷新后的历史记录是否一致；
- 未迁移是主动产品边界、参照项目缺陷，还是后端缺口。

本台账是上述问题的唯一稳定记录。后续新增或修改对话内容类型时，必须同步更新。

## 2. 强制业务规则

### 2.1 两个对话入口必须完全统一

工作流“运行对话窗口”和“智能体助手”必须共同使用：

1. 同一个 SSE / 最终结果解析入口；
2. 同一个内容类型准入规则；
3. 同一个 `MessageBlock` 数据模型；
4. 同一个消息正文渲染组件；
5. 同一套富内容序列化与历史反序列化契约。

两者唯一允许的业务差异是：

- 运行对话窗口用于编辑阶段试运行，消息只保留在当前调试会话；
- 智能体助手用于实际业务运行，需要将最终消息落库并恢复历史；
- 两者的最终回复内容类型、解析结果和渲染效果必须一致。

禁止出现“运行对话窗口可以展示，但智能体助手不支持或刷新后丢失”的幽灵能力。

### 2.2 两类生命周期

每一种对话内容必须在统一 registry 中明确声明生命周期：

- `durable`：最终业务内容。两个对话入口实时展示，智能体助手落库并支持历史恢复。
- `transient`：临时交互内容。两个对话入口实时展示，但不写入 `answer` 或 `contents`，刷新、切换会话后消失属于明确产品行为。

`durable` 注册在类型层面强制提供 `persistType`、`serialize` 和 `restore`；`transient` 不允许进入保存链路。未声明生命周期的内容禁止进入任何对话窗口。

生命周期由内容类型的业务契约声明，不允许业务节点为了绕过后端协议随意把最终结果配置成 `transient`。

### 2.3 持久化内容完整闭环准入标准

一种内容只有同时满足以下条件，才能进入两个对话窗口：

1. 后端运行协议能够稳定返回；
2. 前端能够从 SSE 或最终结果统一解析；
3. 两个对话入口使用同一组件渲染；
4. 后端消息协议有明确的持久化类型和数据结构；
5. 前端能够序列化保存并从历史数据反序列化；
6. 实时展示与刷新后的历史展示结构一致；
7. 已完成真实运行、保存和历史恢复验收。

缺少任意一项，均不得注册为正式对话能力。已有组件、节点执行成功、调试详情可查看或仅能实时展示，都不等于完整闭环。

### 2.4 调试体系与对话体系的边界

- 节点状态、耗时、输入、输出、日志、分支和错误详情继续显示在节点卡片或节点调试详情中。
- 数据库查询结果可以在数据库节点调试详情中查看，但在表格消息协议闭环前，不进入运行对话窗口。
- 调试体系可以展示执行元数据；对话体系只展示满足完整闭环标准的最终业务回复。

## 3. 总体能力矩阵

| 内容类型 | 生命周期 | 参照项目前端实时能力 | 参照项目历史恢复 | 现有后端运行能力 | 现有后端持久化协议 | AI-flow-admin 当前迁移情况 | 当前结论 | 未迁移或受限原因 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 普通文本 / Markdown | `durable` | 已实现流式文本和 Markdown 消息展示 | 通过消息 `answer` 恢复 | `message` SSE 和最终回答均支持 | 消息实体 `answer` | 两个对话入口已统一实时解析和渲染；智能体助手已完成落库及恢复 | 已闭环 | 无 |
| 推理内容 | `transient` | 已实现折叠块并解析推理增量 | 未定义独立恢复；刷新后消失 | LLM 可发送 `reasoning_content`，节点输出包含 `reasoningText` | 无且明确不需要 | 两个入口共用推理增量解析和折叠组件；流式期间默认展开、完成后默认折叠；下一轮提问前移除，不进入 `answer` / `contents` | 临时交互闭环 | 只接收明确的 `reasoning_content`；模型没有正式正文时显示未收到回复，不允许把推理降级成 durable Markdown |
| 基础图表 | `durable`；仅 Base64 降级图为 `transient` | 已实现 ECharts 实时渲染及 Base64 图片降级 | registry 使用 `echarts` 保存并恢复 | 图表节点返回 `chartData`，部分事件可能只有 `chartBase64` | `ChatContentType.ECHARTS` 仅覆盖结构化图表 | 两个对话入口已共用解析与 ECharts 组件；智能体助手已完成 `contents` 保存和恢复；仅 Base64 时作为当前轮临时图片展示 | 结构化图表已闭环；图片降级为明确临时能力 | Base64 降级没有独立图片持久化协议，不伪装成 durable |
| 知识库引用 | `durable`；由引用派生的实时图片块为 `transient` | 已实现引用卡片、召回图片、分块查看、原文预览和下载 | registry 使用 `reference` 保存并恢复 | 检索节点可从根级、`data`、`flowNodeResponse`、`outputs` 返回 `agentSearchData` / `quoteQA` | `ChatContentType.REFERENCE` | 已统一兼容 AgentSearchData、sources、quoteQA 数组及 JSON 字符串；召回图片独立排列在推理后、正文前，引用卡片排列在正文后；历史仍从 durable reference 派生完整展示 | 前端协议、渲染与真实检索已验收 | 已用真实知识库验证 2 条引用、分块打开和 XLSX 原文预览；媒体与文档预览仍以对应后端文件可用为运行前提 |
| 数据库表格 | 条件型：正式结果应为 `durable` | 数据库节点可执行，但正式消息 registry 没有表格解析与持久化注册 | 不支持 | 数据库节点返回 JSON 查询结果 | 未定义表格内容类型 | 表格组件和解析能力保留给节点调试；已从两个对话入口统一排除 | 节点调试可用，对话未支持 | 参照前端和后端都没有正式表格消息闭环；前端不能用 `transient` 绕过持久化协议 |
| 节点运行状态 | 不适用（debug-only） | 工作流调试区支持 | 不保存为对话历史 | SSE 有部分节点事件 | 不属于消息内容协议 | 节点卡片和调试详情已支持；不进入任何对话内容 | 调试能力，不是对话能力 | 运行状态属于执行元数据，本行仅用于澄清边界 |
| 图片 | 条件型：正式结果应为 `durable`；明确降级图可为 `transient` | 有通用图片块、点击放大、附件图片预览、知识库引用图片 | 通用图片没有独立持久化；引用图片可随 `reference` 恢复 | 文件服务支持上传和预览；图表可返回 Base64 | 未定义通用图片类型 | 统一 renderer 已完整支持图片；当前只准入图表 Base64 降级图和引用派生图片，均不冒充通用 durable 图片 | 渲染完整，通用业务协议未闭环 | 缺少统一图片消息 Schema；正式助手图片输出仍不得只靠 transient |
| 文件 / 下载结果 | 条件型：助手正式输出应为 `durable` | 统一 renderer 已支持附件卡片、图片附件放大及 `/gpt/file/download?id=...` 下载 | 没有形成助手输出文件的历史闭环 | 文件服务有上传、查询和下载接口 | 未定义助手文件结果类型 | renderer 与参照项目对齐；运行调试支持用户输入附件，助手输出附件仍未加入对话准入 | 展示基座完成，助手输出协议未闭环 | 用户输入附件和助手输出文件是不同业务契约，后者不能用 `transient` 绕过历史协议 |
| 猜你想问 | `transient` | 已实现 `questionGuide` 实时卡片和点击交互 | registry 明确标记“只实时、不落库” | 后端可在 `workflow_finished` 后发送 `question_guide` SSE，响应对象也可能带 `suggested_questions` | 未定义且不需要持久化类型 | 已统一解析、去重并限制最多 3 条；两个入口共用卡片和点击续问；registry 注册为 `transient`，下一轮提问前移除且不进入 `answer` / `contents` | 临时交互闭环 | 当前工作流编辑器未迁移参照项目隐藏的 `userGuide.questionGuide.open` 配置，只有后端已开启该能力的智能体才会产生事件；该开关不应通过伪造默认值绕过 |
| 结构化业务卡片 | 条件型：正式业务事实应为 `durable` | 只对引用、图表、猜你想问等已知类型专门渲染；未知类型使用 JSON 兜底 | 未知类型无恢复契约 | 未定义通用业务卡片运行 Schema | 未定义 | 只有未知 `custom kind` 的“不支持”兜底 | 未支持 | 缺少明确业务类型、Schema、持久化协议和历史渲染契约 |
| 错误信息 | 条件型：请求错误 `transient`，正式业务结果 `durable` | 支持运行时普通错误文本或提示 | 不作为结构化内容恢复 | SSE 可发送流程或节点错误 | 未定义结构化错误内容类型 | 节点错误进入节点调试体系；对话请求失败只显示当前普通错误提示，不作为富内容落库 | 基础实时支持 | 尚未定义结构化业务错误类型；普通请求失败继续作为临时 UI 提示 |

## 4. 当前正式准入清单

当前统一解析、生命周期与 renderer registry 的有效能力如下：

| 内容 | 实时展示 | 智能体助手落库 | 历史恢复 | 状态 |
| --- | --- | --- | --- | --- |
| 普通文本 / Markdown | 是 | `answer` | 是 | 正式支持 |
| 推理过程 | 是 | 不落库（`transient`） | 不恢复，属于明确产品行为 | 临时交互支持 |
| 基础图表 | 是 | `contents[].type = echarts` | 是 | 正式支持 |
| 知识库引用 | 是 | `contents[].type = reference` | 是 | 前端完整支持，真实知识库检索与预览已验收 |
| 猜你想问 | 是 | 不落库（`transient`） | 不恢复，属于明确产品行为 | 临时交互支持；后端需已开启 questionGuide |
| 知识库召回图片 | 是，独立排列在正文前 | 随 durable `reference` 保存，不单独保存图片块 | 从 `reference` 数据重新派生 | 引用的临时展示视图 |
| 图表 Base64 降级图 | 是 | 不落库（`transient`） | 不恢复 | 仅用于结构化图表缺失时的当前轮降级 |

除上述准入类型外，其他内容即使存在解析器或组件，也不能进入对话窗口。

## 5. 当前统一实现入口

- 统一生命周期及内容准入：`src/features/message-render/richContent.ts` 中的内容类型生命周期表、`ConversationContentCapability`、`resolveConversationNodeRichBlocks` 和 `resolveConversationResultRichBlocks`；`reasoning` 在类型层声明为 `transient`。
- 持久化分流：同一 registry 中的 `serializeDurableConversationBlock` 和 `restoreDurableConversationBlock`；`transient` 内容不会进入保存链路。
- 统一消息模型转换：`src/features/message-render/conversationBlocks.ts`。
- 统一最终文本选择：`conversationBlocks.ts` 中的 `resolveConversationReply`，两端使用相同的 `answerText`、`answer` 和 End 多输出回退规则。
- 统一 SSE 解析：`src/features/message-render/sseContentAdapter.ts`。
- 统一消息正文渲染入口：`src/features/message-render/ConversationMessageContent.tsx`；内部通过 `registry.ts` 和 `registerDefaultRenderers.ts` 注册文本、Markdown、推理、净化 HTML、图片、附件及 custom kind。
- 统一 Markdown 基座：`MarkdownMessageView.tsx` 与 `normalizeMarkdownSource.ts`，支持 GFM 表格、任务列表、代码复制、流式节流和脏历史换行修复。
- 智能体助手富内容保存与恢复：`src/features/agents/overview/utils/chatContents.ts`。
- 运行对话入口：`src/features/workflows/components/debug/WorkflowDebugDrawer.tsx`。
- 智能体助手入口：`src/features/agents/overview/AgentOverviewPage.tsx`。
- 浮动智能助理外壳：`src/features/agents/overview/components/FloatingAiAssistant.tsx`；只复用正式助手，不复制会话或解析逻辑。

数据库表格的通用解析器和组件可以继续存在，但对话准入函数会统一过滤它；它只能在明确的节点调试详情中使用。

## 6. 新内容类型的固定开发流程

新增图片、文件、表格、业务卡片等能力时，必须按以下顺序推进：

1. 先分析参照前端的实时解析、组件、历史恢复和已知缺陷；
2. 明确该内容是 `durable` 最终结果还是 `transient` 临时交互，禁止生命周期不明的内容进入对话；
3. `durable` 必须确认后端运行事件和消息持久化协议；`transient` 必须确认不保存是明确业务语义，并定义失效时机；
4. 定义稳定的内容类型、Schema 和版本兼容策略；
5. 在统一解析层实现 SSE / 最终结果转换；`durable` 还必须实现历史数据转换；
6. 在统一消息组件中注册渲染器；
7. `durable` 在智能体助手实现序列化保存与反序列化恢复；`transient` 必须由统一保存入口自动排除；
8. 运行对话窗口不得编写独立解析或独立渲染分支；
9. `durable` 完成实时、保存和刷新恢复验收；`transient` 完成两个入口实时一致、下一轮失效及不落库验收；
10. 更新本台账后，才能标记为正式支持。

## 7. 禁止事项

- 禁止为了演示效果，把未在 registry 明确注册为 `transient` 的实时内容加入运行对话窗口。
- 禁止运行对话窗口和智能体助手分别维护内容白名单。
- 禁止同一种消息在两个入口使用不同组件渲染。
- 禁止把节点调试详情误认为对话消息能力。
- 禁止后端没有消息协议时由前端私自定义仅本地可识别的数据结构。
- 禁止用“已有组件”代替真实运行、落库和历史恢复验收。

## 8. 参照和后端证据入口

- 参照前端默认渲染器：`agent-open-cloud-protal/src/features/message-render/registerDefaultRenderers.ts`
- 参照前端节点内容及持久化 registry：`agent-open-cloud-protal/src/features/message-render/adapters/flowNodeRenderRegistry.ts`
- 参照前端猜你想问：`agent-open-cloud-protal/src/features/message-render/adapters/questionGuide.ts`
- 参照前端附件展示：`agent-open-cloud-protal/src/features/message-render/blocks/AttachmentBlock.tsx`
- 后端富内容类型：`agent-open-base/src/main/java/com/agent/open/base/entity/chat/ChatContentType.java`
- 后端消息实体：`agent-open-base/src/main/java/com/agent/open/base/entity/chat/AgentOpenChatMessage.java`
- 后端猜你想问：`agent-open-base/src/main/java/com/agent/open/base/service/flow/GuessQuestionService.java`
