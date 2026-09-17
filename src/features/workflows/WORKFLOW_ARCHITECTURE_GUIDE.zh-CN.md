# 工作流前端架构与快速阅读指南

> 更新时间：2026-08-27  
> 适用范围：`AI-flow-admin` 的工作流编排、节点体系、运行调试、正式会话和富内容渲染。  
> 本文回答两个问题：相关功能分别放在哪里，以及为什么要这样划分。

## 1. 先建立整体心智模型

这套功能不是一个“画布组件”，而是三个相互协作、边界不同的业务域：

```text
智能体入口域
  我的智能体 / 创建智能体 / 智能体助手
                  │
                  ▼
工作流编排域
  画布、节点、变量、连线、保存、解析、校验、SSE 调试
                  │
                  ▼
对话内容域
  文本、推理、图表、知识库引用、猜你想问、落库与历史恢复
```

- `features/agents` 负责“用户从哪里创建、选择和使用智能体”。
- `features/workflows` 负责“智能体工作流如何被编辑、保存和执行”。
- `features/message-render` 负责“执行结果如何变成统一的对话内容”。

三者不能重新揉成一个目录：工作流调试信息不是聊天消息，聊天内容也不应反向依赖某个节点面板。

## 2. 最重要的架构原则

### 2.1 registry 是节点扩展中心

每个节点都独立注册为 `WorkflowNodeModule`。公共代码只向 registry 询问：

- 节点叫什么、属于哪个分类；
- 默认配置是什么；
- 使用哪个配置面板和画布组件；
- 对外提供哪些输出变量；
- 如何序列化为后端 module；
- 如何从后端 module 恢复；
- 如何做配置、连线和引用校验；
- 如何显示运行详情。

因此，新增节点通常是“新增 contract + panel + module，再注册”，而不是继续向画布、保存器和校验器中添加大段 `switch`。

### 2.2 前端模型与后端协议分开

前端使用 React Flow 的 `nodes / edges`，后端使用：

```text
modules / edges / chatConfig.variables
```

两者通过节点 contract 和 `workflowSerialization.ts` 转换。这样做的原因是：

- 画布需要位置、选择状态、父子关系等 UI 数据；
- 后端需要 `flowNodeType`、inputs、outputs 等执行协议；
- 后端旧数据兼容不应污染组件；
- 保存和刷新恢复必须能做双向转换。

### 2.3 配置状态、运行状态、消息状态相互独立

系统目前有三个不同事实源：

| 状态 | 事实源 | 生命周期 |
| --- | --- | --- |
| 工作流配置 | Zustand 画布 store | 编辑、撤销、保存和刷新恢复 |
| 节点执行状态 | `WorkflowExecutionContext` | 单次调试运行 |
| 对话消息 | 调试抽屉本地消息或正式会话后端记录 | 按 transient / durable 规则处理 |

不要把执行状态写回节点配置，也不要把节点日志塞进对话消息。否则 dirty 判断、保存 payload 和历史消息都会互相污染。

### 2.4 调试体系与对话体系分离

- 节点状态、耗时、输入输出、日志、分支和错误详情属于调试体系。
- 文本、图表、知识库引用等属于对话内容体系。
- 工作流运行对话和智能体助手共用同一内容解析与渲染规则。
- durable 内容进入正式消息保存；transient 内容只在当前交互展示。

详细准入规则以 `../message-render/CHAT_CONTENT_CAPABILITY.zh-CN.md` 为准。

## 3. 目录分布

### 3.1 工作流编排域

```text
src/features/workflows/
├── WorkflowsPage.tsx              页面入口：根据路由创建或读取工作流
├── components/                    画布、节点外壳、配置 Dock、调试抽屉
│   ├── WorkflowCanvas.tsx         React Flow 总编排和页面工具栏
│   ├── WorkflowNode.tsx           通用普通节点外观
│   ├── LoopContainerNode.tsx      循环父容器专用画布组件
│   ├── NodeConfigPanel.tsx        根据 registry 打开对应配置面板
│   ├── NodeSidebar.tsx            节点库
│   ├── WorkflowPublishDialog.tsx  发布入口
│   ├── config-panels/             每类节点的编辑 UI
│   ├── debug/                     运行对话和工作流调试
│   └── node-execution/            节点运行详情组件
├── nodes/                         节点模块与统一 registry
│   ├── types.ts                   WorkflowNodeModule 插件接口
│   ├── registry.ts                NODE_MODULE_REGISTRY
│   ├── *NodeModule.tsx            每个节点的装配入口
│   └── placeholderNodeModules.tsx 未实现节点占位；不进入真实节点库
├── contracts/                     节点业务协议
│   ├── *NodeContract.ts           默认值、normalize、输入输出、转换、校验
│   ├── legacyConfigMigrations.ts  旧配置兼容
│   └── shared.ts                  contract 公共构造工具
├── store/
│   └── useWorkflowCanvasStore.ts  nodes、edges、选择、撤销和编辑操作
├── api/                           HTTP/SSE 原始接口
├── hooks/                         Query/Mutation 和运行状态编排
├── context/                       节点运行状态只读注入
├── utils/                         跨节点的纯业务算法
├── types.ts                       工作流配置和后端协议类型
├── types/execution.ts             SSE 与节点执行状态类型
└── workflow.css                   React Flow 局部样式
```

### 3.2 对话内容域

```text
src/features/message-render/
├── richContent.ts                 内容准入、生命周期、富内容解析和持久化 codec
├── conversationBlocks.ts          文本/推理增量和统一最终正文选择
├── sseContentAdapter.ts           SSE 到 ContentDelta 的唯一转换入口
├── ConversationMessageContent.tsx 两个对话入口共用的唯一正文渲染器
├── registry.ts                    renderer 注册表
├── registerDefaultRenderers.ts    默认内容类型注册
├── DefaultBlockRenderers.tsx      文本、推理、HTML、图片和附件渲染器
├── MarkdownMessageView.tsx        GFM Markdown、代码复制与流式节流
├── normalizeMarkdownSource.ts     Markdown 源文唯一规范化入口
├── CustomMessageBlock.tsx         已知 custom kind 业务分发
├── EChartsMessageBlock.tsx        图表
├── ReferenceMessageBlock.tsx      知识库引用
├── QuestionGuideMessageBlock.tsx  猜你想问
├── DataTableMessageBlock.tsx      表格组件；当前只允许调试使用
├── knowledgeReference.ts          引用数据规范化
├── knowledgeReferenceApi.ts       引用预览和下载接口
└── CHAT_CONTENT_CAPABILITY.zh-CN.md 生命周期和前后端能力台账
```

这个目录独立于 `workflows`，是因为同一条正式消息还要在智能体助手和历史记录中展示，不能只服务调试抽屉。

### 3.3 智能体入口域

```text
src/features/agents/
├── myAgents/
│   ├── MyAgentsPage.tsx           真实智能体列表
│   └── components/
│       ├── CreateAgentDialog.tsx  创建名称和描述
│       └── AgentListCard.tsx      进入编辑、运行等入口
├── overview/
│   ├── AgentOverviewPage.tsx      正式会话、SSE、消息保存和历史查询
│   ├── components/                智能体选择、输入框、消息组件出口、浮动智能助理外壳
│   └── utils/
│       ├── chatContents.ts        durable 富内容保存与恢复
│       ├── overviewMessages.ts    后端消息转 UI 消息
│       └── blockHelpers.ts        转发统一 message-render 能力
└── api/
    ├── agentApi.ts                智能体读取和发布态查询
    └── chatApi.ts                 会话分组、消息和点赞接口
```

浮动智能助理不拥有独立会话实现。它通过 `FloatingAiAssistant` 提供拖拽、紧凑/放大窗口与历史侧栏外壳，内部仍然挂载 `AgentOverviewPage`，因此正式页面与浮窗天然共享相同的接口、SSE、持久化和 renderer。

### 3.4 跨域公共层

```text
src/types/                        Agent、Chat、MessageBlock 等共享类型
src/components/ui/                shadcn 基础组件
src/components/layout/            Header、Sidebar 等应用外壳
src/stores/auth*                  登录 Token 与租户状态
```

公共层只放跨业务复用内容。节点配置和节点协议仍应留在 `features/workflows`。

## 4. 为什么节点要拆成 contract、panel 和 module

以一个业务节点为例：

```text
contracts/concatNodeContract.ts
  负责“文本拼接是什么”

components/config-panels/ConcatConfigPanel.tsx
  负责“用户如何编辑它”

nodes/concatNodeModule.tsx
  负责“把协议、UI 和 registry 装配起来”
```

### contract 负责稳定业务语义

通常包含：

- 默认配置；
- 后端 input/output key；
- normalize 和旧数据兼容；
- serialize / parse；
- 输出变量定义；
- 变量引用收集；
- 业务校验。

contract 应尽量是纯函数，便于单独核对协议，不依赖 React 页面状态。

### panel 只负责编辑体验

panel 接收统一的：

```ts
nodeId / config / variables / onUpdate / onRemoveSourceHandle
```

它不直接调用保存接口，也不直接修改 Zustand。这样配置 UI 可以变化，但业务协议保持稳定。

### module 是节点的装配清单

`WorkflowNodeModule` 把以下内容放在一个可查询对象中：

```text
definition + icon + config defaults + panel + execution details
+ outputs + references + serialize + parse + validate + connection rules
```

因此阅读某个节点时，先看 module，就能知道它使用了哪些 contract、panel 和运行详情。

## 5. 六条核心调用链

### 5.1 创建和读取

```text
我的智能体
  → CreateAgentDialog
  → /workflows?new=1 + workflowDraft
  → WorkflowsPage
  → resetToNewWorkflow
  → 默认 Start + End
```

已有智能体：

```text
/workflows?id=agentId
  → useWorkflowAgent
  → parseAgentSetting
  → parseWorkflowFromBackend
  → 每个 module.parse
  → replaceWorkflow
```

### 5.2 添加和配置节点

```text
NodeSidebar
  → registry 中 paletteVisible 且 backendRunnable 的节点
  → store.addNode
  → module.createDefaultConfig
  → WorkflowNode / CanvasComponent
  → NodeConfigPanel
  → module.ConfigPanel
  → store.updateNodeConfig
```

MCP 和插件目前属于 placeholder：虽有类型和占位模块，但 `backendRunnable=false`，不会进入真实节点库。

### 5.3 变量发现与引用

```text
module.getOutputs(node)
  → availableVariables.ts 计算真实上游
  → VariablePicker
  → {{nodeId.outputKey}}
  → module.getReferences(node)
  → workflowValidation.ts 校验节点、字段、方向和类型
```

变量列表不是所有节点输出的全集，而是当前节点真正可引用的上游输出。循环内部还有独立作用域。

### 5.4 连线与保存前校验

```text
React Flow onConnect
  → connectionRules.ts 即时阻止非法连接
  → store.onConnect
  → workflowValidation.ts 保存/运行前完整图校验
```

完整校验包括：

- 唯一 Start、至少一个 End；
- 孤立节点、环路和不可达节点；
- 节点级配置和动态分支；
- 变量引用存在性、上游关系和类型；
- 循环父子关系、作用域和跨边界连线。

即时连线校验用于交互反馈，完整校验用于保护后端协议，两者不能互相替代。

### 5.5 保存和刷新恢复

```text
nodes + edges
  → validateWorkflowForBackend
  → serializeWorkflowToBackend
  → 每个 module.serialize
  → buildAgentSettingString
  → saveWorkflowConfig
  → savedBaseline
```

刷新恢复执行反向链路：

```text
agentSetting
  → parseWorkflowFromBackend
  → backend flowNodeType 查 module
  → module.parse
  → React Flow nodes / edges
```

dirty 判断比较的是规范化后的持久化 payload，而不是 React 组件实例。

### 5.6 SSE 运行、调试和对话

```text
WorkflowDebugDrawer / AgentOverviewPage
  → runWorkflowStream
  ├─ node event       → 节点运行状态和调试详情
  ├─ message content  → durable Markdown
  ├─ reasoning_content→ transient 推理块
  ├─ special event    → registry 准入的对话辅助内容
  └─ workflow_finished→ 最终 outputs 和运行终态
```

节点状态链：

```text
SSE node event
  → useWorkflowCanvasExecution
  → workflowNodeExecution.ts
  → WorkflowExecutionContext
  → WorkflowNode / ExecutionDetails
```

对话内容链：

```text
SSE / 最终 outputs
  → richContent.ts + conversationBlocks.ts
  → MessageBlock[]
  → ConversationMessageContent
  → durable 保存 / transient 丢弃
```

## 6. 循环体为什么是特殊节点

普通节点是一张卡片，循环体同时是：

- 后端 `loopRun` 节点；
- React Flow 父容器；
- 内部变量作用域；
- 多个子节点的序列化边界。

因此它额外涉及：

```text
loopNodeContract.ts   循环输入、输出和三个后端节点协议
loopNodeModule.tsx    loop / loopStart / loopBreak 三个注册模块
LoopContainerNode.tsx 容器外观和手动尺寸调整
loopLayout.ts         父子坐标、拖入拖出和 children 同步
workflowSerialization.ts 绝对/相对坐标和 parentNodeId 转换
workflowValidation.ts    内部可达性、作用域和跨边界限制
```

循环框尺寸采用用户手动拖拽并持久化，不做自动包围所有子节点的复杂布局计算。

## 7. 对话内容为什么还需要第二个 registry

节点 registry 回答“哪个节点如何执行”，消息 registry 回答“哪些执行结果可以进入对话”。两者不是一回事。

当前生命周期：

| 内容 | 生命周期 | 行为 |
| --- | --- | --- |
| 普通文本 / Markdown | durable | 保存到 `answer` 并恢复 |
| 基础图表 | durable | 保存为 `contents[].type=echarts` |
| 知识库引用 | durable | 保存为 `contents[].type=reference` |
| 推理过程 | transient | 当前轮展示，不落库，下一轮移除 |
| 猜你想问 | transient | 当前轮交互，不落库，下一轮移除 |
| 数据库表格 | 未准入 | 当前仅节点调试展示 |

如果只在调试抽屉临时添加一个渲染分支，会产生“调试能看、正式运行不能看”或“刷新后消失”的幽灵能力。因此两个对话入口必须调用相同的解析、准入和渲染组件。

## 8. 宏观快速阅读代码的方法

不要从配置面板逐行阅读，也不要一开始就钻进所有节点。推荐按下面顺序建立地图。

### 第一轮：15 分钟看入口和边界

依次浏览：

1. `PROJECT_MEMORY.zh-CN.md`：知道已经完成什么、哪些是后端缺口。
2. `NODE_MIGRATION_PLAN.zh-CN.md`：知道节点迁移和差异归属。
3. `WorkflowsPage.tsx`：理解新增、读取和路由 agentId。
4. `WorkflowCanvas.tsx`：只看它组合了哪些 hook、store、面板和按钮，不逐行研究 JSX。
5. `nodes/registry.ts`：确认真实节点清单和扩展入口。

完成后应能回答：页面从哪里进、画布状态在哪里、节点从哪里注册、保存和运行由谁发起。

### 第二轮：20 分钟跟踪一个最简单节点

建议选择文本拼接：

```text
concatNodeModule.tsx
  → concatNodeContract.ts
  → ConcatConfigPanel.tsx
  → workflowSerialization.ts
  → availableVariables.ts
  → workflowValidation.ts
```

不要同时看十个节点。先用一个节点理解统一模板，再比较 HTTP、判断器等复杂节点增加了什么。

### 第三轮：15 分钟看数据往返

重点阅读：

1. `types.ts` 中 `WorkflowCanvasNode`、`WorkflowModule`、`WorkflowBackendPayload`。
2. `workflowSerialization.ts` 的正向和反向转换。
3. 任一 contract 的 `serialize / parse`。
4. `workflowApi.ts` 的 `agentSetting` 包装。

此轮目标是能手工解释一个画布节点如何变成后端 JSON，又如何恢复回来。

### 第四轮：15 分钟看运行状态机

按调用顺序阅读：

```text
WorkflowDebugDrawer
  → useWorkflowRuntime
  → workflowRunApi.runWorkflowStream
  → useWorkflowCanvasExecution
  → workflowNodeExecution
  → WorkflowExecutionContext
```

重点区分节点事件、消息增量和 `workflow_finished`，不要把 SSE 连接关闭误认为业务成功。

### 第五轮：15 分钟看正式会话

按下面顺序阅读：

```text
CHAT_CONTENT_CAPABILITY.zh-CN.md
  → richContent.ts
  → conversationBlocks.ts
  → ConversationMessageContent.tsx
  → AgentOverviewPage.tsx
  → overview/utils/chatContents.ts
```

此轮目标是理解实时展示、durable 落库、历史恢复和 transient 清理为什么必须使用同一规则。

### 第六轮：按需看特殊能力

- 循环：从 `loopNodeModule.tsx` 开始，沿第 6 节文件阅读。
- 动态分支：看 `conditionNodeModule.tsx`、`edgeHandles.ts` 和 `connectionRules.ts`。
- 文件与知识库：看对应 contract、API、配置面板和消息引用组件。
- 图表：先看节点 contract，再看 `EChartsMessageBlock.tsx`。

完成前五轮后再看特殊节点，会快很多。

## 9. 阅读时只追踪四种对象

宏观阅读不需要记住所有组件，只追踪四种对象即可：

1. `WorkflowCanvasNode`：画布上的节点。
2. `WorkflowModule`：提交给后端的节点。
3. `NodeExecutionState`：某次运行中的节点状态。
4. `MessageBlock`：最终进入对话渲染的内容块。

遇到复杂代码时先判断它正在处理哪一种对象，通常就能快速定位层次。

## 10. 常见需求应该从哪里开始看

| 需求 | 第一入口 | 后续文件 |
| --- | --- | --- |
| 新增节点 | `nodes/*NodeModule.tsx` | contract、panel、registry |
| 修改后端字段 | 对应 `contracts/*NodeContract.ts` | serialization、types |
| 修改节点配置 UI | `components/config-panels/*` | 对应 contract 默认值和校验 |
| 修改变量下拉 | `availableVariables.ts` | module.getOutputs、getReferences |
| 修改连线规则 | module.connection | `connectionRules.ts`、`edgeHandles.ts` |
| 修改保存/刷新 | `workflowSerialization.ts` | workflowApi、contract parse/serialize |
| 修改运行状态 | `workflowRunApi.ts` | useWorkflowCanvasExecution、workflowNodeExecution |
| 修改调试详情 | `node-execution/` | module.ExecutionDetails |
| 修改聊天内容 | `message-render/richContent.ts` | conversationBlocks、统一 renderer |
| 修改历史恢复 | `overview/utils/chatContents.ts` | chatApi、richContent codec |
| 修改循环容器 | `loopNodeModule.tsx` | loop contract、loopLayout、serialization、validation |

## 11. 新节点的完整交付清单

一个节点不是“能拖进画布”就完成。至少需要检查：

1. `WorkflowNodeType` 和后端 `flowNodeType` 映射；
2. contract 默认值与 normalize；
3. 配置面板；
4. 独立 node module；
5. registry 注册与节点库可见性；
6. serialize / parse 双向一致；
7. 输入引用与输出变量；
8. 普通或动态 Handle；
9. 连线和业务校验；
10. SSE 运行状态；
11. 调试输入、输出、错误与脱敏；
12. 保存、刷新恢复和真实后端运行验收；
13. 前后端不一致项写入迁移台账；
14. 如果产生对话内容，再单独通过消息生命周期准入。

## 12. 当前必须记住的边界

- 参照前端决定迁移的功能和交互语义，后端用于联调和差异确认。
- MCP 和插件仍是 placeholder，不是已迁移真实节点。
- 文件解析的 PDF/Word/Excel 乱码属于现有后端取文件与类型识别问题。
- 知识库节点前端主体和真实检索展示已验收；具体模型、文件与索引可用性属于运行环境前提。
- 代码节点的 Python 当前仍被后端 JavaScript 引擎执行。
- 数据库表格只进入节点调试，不进入正式对话。
- 循环前端主体和数组模式已验收；条件循环和判断器 ELSE 未连线语义属于现有后端能力边界。
- 不新增自动化测试依赖；当前使用 TypeScript、真实后端和浏览器验收。

这些限制的最新状态以 `NODE_MIGRATION_PLAN.zh-CN.md` 和 `CHAT_CONTENT_CAPABILITY.zh-CN.md` 为准，不要只根据页面是否出现组件判断完成度。

## 13. 宏观 review 的完成标准

完成一次宏观阅读后，不要求能立即写出所有节点，但应当能回答：

- 新建和已有智能体分别怎样进入工作流页面？
- 一个节点如何在 registry 中被发现？
- 节点配置如何变成后端 module，又如何恢复？
- 变量为什么只能选择真实上游输出？
- 连线即时校验和保存前完整校验有什么区别？
- SSE 中节点事件、正文、推理和流程终态分别去哪？
- 为什么调试详情不属于对话消息？
- durable 和 transient 内容分别怎样处理？
- 循环体为什么需要父子坐标和独立作用域？
- 哪些能力是前端已完成但受后端环境限制？

能清楚回答这些问题，就已经掌握了项目的宏观结构。之后再按具体任务沿调用链深入，比从头逐文件阅读高效得多。
